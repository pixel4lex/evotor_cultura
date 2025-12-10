import math
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status

from backend.app.config import DEFAULT_ORDER_STATUS, DEFAULT_CURRENCY
from backend.app.db import supabase
from backend.app.models import (
    CreateOrderPayload,
    OrderResult,
    UpdateOrderPayload,
)
from backend.app.services.auth_service import current_admin, current_user
from backend.app.services.order_service import (
    attach_user,
    build_order_result,
    build_user_snapshot,
    fallback_user_from_record,
    fetch_user_profile,
)
from backend.app.services.catalog_service import fetch_product, update_product_quantity

router = APIRouter(prefix="", tags=["orders"])


async def decrease_inventory_for_items(items: Any) -> None:
    if not isinstance(items, list):
        return

    adjustments: Dict[str, float] = {}

    for entry in items:
        if not isinstance(entry, dict):
            continue

        product_id = entry.get("id")
        if isinstance(product_id, (str, int)):
            product_id_str = str(product_id)
        else:
            continue

        raw_quantity = entry.get("quantity")
        quantity_to_subtract = 1.0

        try:
            candidate = float(raw_quantity)
        except (TypeError, ValueError):
            candidate = None

        if candidate is not None and math.isfinite(candidate) and candidate > 0:
            quantity_to_subtract = candidate

        adjustments[product_id_str] = adjustments.get(product_id_str, 0.0) + quantity_to_subtract

    if not adjustments:
        return

    for product_id, decrement in adjustments.items():
        if decrement <= 0:
            continue

        product = await fetch_product(product_id)
        if product is None:
            raise HTTPException(
                status_code=500,
                detail=f"Товар с идентификатором {product_id} не найден в Evotor.",
            )

        current_quantity_raw = product.get("quantity")
        try:
            current_quantity = float(current_quantity_raw)
        except (TypeError, ValueError):
            current_quantity = decrement

        if not math.isfinite(current_quantity):
            current_quantity = decrement

        new_quantity = current_quantity - decrement
        if new_quantity < 0:
            new_quantity = 0.0

        await update_product_quantity(product_id, new_quantity)


@router.post("/", response_model=OrderResult, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: CreateOrderPayload,
    authorization: Optional[str] = Header(default=None),
) -> OrderResult:
    user: Optional[Dict[str, Any]] = None
    if authorization:
        try:
            user = await current_user(authorization=authorization)
        except HTTPException as exc:
            if exc.status_code not in {401, 403}:
                raise
            user = None

    if not payload.items:
        raise HTTPException(status_code=400, detail="Нельзя создать заказ без товаров.")

    metadata: Dict[str, Any] = {}
    if user:
        metadata = user.get("user_metadata") or {}
        if not isinstance(metadata, dict):
            metadata = {}

    raw_full_name = payload.customer_name or metadata.get("full_name")
    customer_name = raw_full_name.strip() if isinstance(raw_full_name, str) and raw_full_name.strip() else None

    raw_phone = payload.customer_phone or metadata.get("phone")
    customer_phone = raw_phone.strip() if isinstance(raw_phone, str) and raw_phone.strip() else None

    candidate_email = payload.customer_email or (user.get("email") if user else None)
    customer_email = candidate_email if isinstance(candidate_email, str) and candidate_email else None

    if user is None and (not customer_name or not customer_phone):
        raise HTTPException(status_code=400, detail="Укажите имя и телефон для оформления заказа.")

    items_payload = [item.model_dump() for item in payload.items]
    total_cost = sum(item.price * item.quantity for item in payload.items)

    shipping_payload = payload.shipping_address.model_dump()
    if not shipping_payload.get("address"):
        raise HTTPException(status_code=400, detail="Укажите адрес доставки.")
    if not shipping_payload.get("title"):
        shipping_payload["title"] = "Адрес доставки"

    insert_payload = {
        "user_id": user.get("id") if user else None,
        "status": DEFAULT_ORDER_STATUS,
        "currency": payload.currency or DEFAULT_CURRENCY,
        "total_cost": total_cost,
        "items": items_payload,
        "shipping_address": shipping_payload,
        "customer_name": customer_name,
        "customer_phone": customer_phone,
        "customer_email": customer_email,
    }

    try:
        response = supabase.table("orders").insert(insert_payload).execute()
    except Exception as exc:
        print(f"Не удалось создать заказ: {exc}")

        raise HTTPException(status_code=500, detail="Не удалось создать заказ.") from exc

    error_payload = getattr(response, "error", None)
    if error_payload:
        detail = getattr(error_payload, "message", None) or getattr(error_payload, "error_message", None) or error_payload
        print(f"Не удалось создать заказ: {detail}")
        raise HTTPException(status_code=500, detail=f"Не удалось создать заказ: {detail}")

    data = getattr(response, "data", None) or []
    if not data:
        raise HTTPException(status_code=500, detail="Supabase не вернул данные по заказу.")

    record = data[0]
    record.setdefault("customer_name", customer_name)
    record.setdefault("customer_phone", customer_phone)
    record.setdefault("customer_email", customer_email)

    profile = None
    if user:
        profile = fetch_user_profile(user.get("id"))
        if not profile:
            snapshot = build_user_snapshot(user)
            if snapshot:
                profile = snapshot
            else:
                profile = fallback_user_from_record(record)
    else:
        profile = fallback_user_from_record(record)

    if profile:
        record["user"] = profile

    return build_order_result(record)


@router.get("/me", response_model=List[OrderResult])
async def list_my_orders(user: Dict[str, Any] = Depends(current_user)) -> List[OrderResult]:
    user_id = user.get("id")

    try:
        response = (
            supabase.table("orders")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Не удалось получить заказы пользователя.") from exc

    data = getattr(response, "data", None) or []
    enriched = attach_user(data)

    return [build_order_result(record) for record in enriched]


@router.get("/viewall", response_model=List[OrderResult])
async def list_orders(_: Dict[str, Any] = Depends(current_admin)) -> List[OrderResult]:
    try:
        response = supabase.table("orders").select("*").order("created_at", desc=True).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Не удалось получить список заказов.") from exc

    data = getattr(response, "data", None) or []
    enriched = attach_user(data)

    return [build_order_result(record) for record in enriched]

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: int,
    _: Dict[str, Any] = Depends(current_admin),
) -> None:
    try:
        response = (
            supabase.table("orders")
            .delete()
            .eq("id", order_id)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Не удалось удалить заказ: {exc}",
        ) from exc

    data = getattr(response, "data", None) or []
    if not data:
        raise HTTPException(status_code=404, detail="Заказ не найден.")



@router.patch("/{order_id}", response_model=OrderResult)
async def update_order(
    order_id: int,
    payload: UpdateOrderPayload,
    _: Dict[str, Any] = Depends(current_admin),
) -> OrderResult:
    updates: Dict[str, Any] = {}
    should_decrease_inventory = False

    if payload.status is not None:
        updates["status"] = payload.status
    if payload.currency is not None:
        updates["currency"] = payload.currency
    if payload.total_cost is not None:
        updates["total_cost"] = payload.total_cost
    if payload.items is not None:
        updates["items"] = [item.model_dump() for item in payload.items]
    if payload.shipping_address is not None:
        updates["shipping_address"] = payload.shipping_address.model_dump()
# added
    if payload.shipping_address is not None:
        updates["shipping_address"] = payload.shipping_address.model_dump()

    if payload.tracking_code is not None:
        updates["tracking_code"] = payload.tracking_code
# ---
    if not updates:
        raise HTTPException(status_code=400, detail="Нет данных для обновления заказа.")

    if payload.status is not None:
        try:
            current_response = (
                supabase.table("orders")
                .select("*")
                .eq("id", order_id)
                .limit(1)
                .execute()
            )
        except Exception as exc:
            print(f"Не удалось получить заказ перед обновлением: {exc}")
            raise HTTPException(status_code=500, detail="Не удалось получить заказ перед обновлением.") from exc

        current_data = getattr(current_response, "data", None) or []
        if not current_data:
            raise HTTPException(status_code=404, detail="Заказ не найден.")

        previous_record = current_data[0]
        previous_status = previous_record.get("status")
        should_decrease_inventory = payload.status == "Одобрен" and previous_status != "Одобрен"

    try:
        response = (
            supabase.table("orders")
            .update(updates)
            .eq("id", order_id)
            .execute()
        )
    except Exception as exc:
        print(f"Не удалось обновить заказ: {exc}")

        raise HTTPException(status_code=500, detail=f"Не удалось обновить заказ: {exc}") from exc

    error_payload = getattr(response, "error", None)
    if error_payload:
        detail = getattr(error_payload, "message", None) or getattr(error_payload, "error_message", None) or error_payload
        print(f"Не удалось обновить заказ f: {detail}")

        raise HTTPException(status_code=500, detail=f"Не удалось обновить заказ: {detail}")

    data = getattr(response, "data", None) or []
    if not data:
        try:
            fetch_response = (
                supabase.table("orders")
                .select("*")
                .eq("id", order_id)
                .limit(1)
                .execute()
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Не удалось получить обновленный заказ: {exc}") from exc

        data = getattr(fetch_response, "data", None) or []
        if not data:
            raise HTTPException(status_code=404, detail="Заказ не найден.")

    record = data[0]
    profile = fetch_user_profile(record.get("user_id"))
    if not profile:
        profile = fallback_user_from_record(record)

    if profile:
        record["user"] = profile

    if should_decrease_inventory:
        try:
            await decrease_inventory_for_items(record.get("items"))
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=500, detail="Не удалось обновить остатки товаров.") from exc

    return build_order_result(record)

