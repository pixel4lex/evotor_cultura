from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional

from backend.app.config import DEFAULT_CURRENCY, DEFAULT_ORDER_STATUS
from backend.app.db import supabase
from backend.app.models import OrderResult, OrderUser, OrderShippingAddress, OrderItemPayload
from backend.app.services.db_service import to_dict


def parse_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value

    if isinstance(value, str):
        value = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            pass

    return datetime.utcnow()


def normalize_items(raw_items: Iterable[Dict[str, Any]] | None) -> List[OrderItemPayload]:
    normalized: List[OrderItemPayload] = []
    if not raw_items:
        return normalized

    for entry in raw_items:
        if not isinstance(entry, dict):
            continue
        try:
            normalized.append(OrderItemPayload(**entry))
        except Exception:
            continue
    return normalized


def normalize_shipping(raw_shipping: Dict[str, Any] | None) -> Optional[OrderShippingAddress]:
    if not raw_shipping:
        return None

    try:
        return OrderShippingAddress(**raw_shipping)
    except Exception:
        return None


def build_user_snapshot(user: Dict[str, Any] | None) -> Dict[str, Any]:
    if not isinstance(user, dict):
        return {}

    snapshot: Dict[str, Any] = {}

    user_id = user.get("id")
    if user_id is not None:
        snapshot["id"] = str(user_id)

    email = user.get("email")
    if isinstance(email, str) and email:
        snapshot["email"] = email

    metadata = user.get("user_metadata") or {}
    if not isinstance(metadata, dict):
        metadata = {}

    snapshot_meta: Dict[str, Any] = {}

    raw_name = metadata.get("full_name")
    if isinstance(raw_name, str) and raw_name.strip():
        snapshot_meta["full_name"] = raw_name.strip()

    raw_phone = metadata.get("phone")
    if isinstance(raw_phone, str) and raw_phone.strip():
        snapshot_meta["phone"] = raw_phone.strip()

    if snapshot_meta:
        snapshot["user_metadata"] = snapshot_meta

    return snapshot


def fallback_user_from_record(record: Dict[str, Any] | None) -> Dict[str, Any] | None:
    if not isinstance(record, dict):
        return None

    snapshot: Dict[str, Any] = {}

    user_id = record.get("user_id")
    if user_id is not None:
        snapshot["id"] = str(user_id)

    email = record.get("customer_email") or record.get("email")
    if isinstance(email, str) and email:
        snapshot["email"] = email

    metadata: Dict[str, Any] = {}

    name = record.get("customer_name")
    if isinstance(name, str) and name.strip():
        metadata["full_name"] = name.strip()

    phone = record.get("customer_phone")
    if isinstance(phone, str) and phone.strip():
        metadata["phone"] = phone.strip()

    if metadata:
        snapshot["user_metadata"] = metadata

    return snapshot or None


def make_order_user(record: Dict[str, Any], user_payload: Dict[str, Any] | None) -> OrderUser:
    user_payload = user_payload or {}
    metadata = user_payload.get("user_metadata") or {}

    name = None
    if isinstance(metadata, dict):
        raw_name = metadata.get("full_name")
        if isinstance(raw_name, str) and raw_name.strip():
            name = raw_name.strip()

        raw_phone = metadata.get("phone")
    else:
        raw_phone = None
    phone = raw_phone if isinstance(raw_phone, str) else None

    user_id = user_payload.get("id")
    if user_id is None:
        user_id_str = ""
    else:
        user_id_str = str(user_id)

    if not user_id_str and isinstance(record, dict):
        fallback_user_id = record.get("user_id")
        if fallback_user_id is not None:
            user_id_str = str(fallback_user_id)

    if name is None and isinstance(record, dict):
        fallback_name = record.get("customer_name")
        if isinstance(fallback_name, str) and fallback_name.strip():
            name = fallback_name.strip()

    if phone is None and isinstance(record, dict):
        fallback_phone = record.get("customer_phone")
        if isinstance(fallback_phone, str) and fallback_phone.strip():
            phone = fallback_phone.strip()

    if name is None:
        email_hint = user_payload.get("email")
        if isinstance(email_hint, str) and email_hint:
            name = email_hint

    if name is None and isinstance(record, dict):
        email_hint = record.get("customer_email")
        if isinstance(email_hint, str) and email_hint:
            name = email_hint

    email_value = user_payload.get("email")
    if not isinstance(email_value, str) or not email_value:
        if isinstance(record, dict):
            fallback_email = record.get("customer_email")
            if isinstance(fallback_email, str) and fallback_email:
                email_value = fallback_email
            else:
                email_value = None

    return OrderUser(
        id=user_id_str,
        email=email_value,
        name=name,
        phone=phone,
    )


def build_order_result(record: Dict[str, Any]) -> OrderResult:
    record_map: Dict[str, Any]
    if isinstance(record, dict):
        record_map = record
    else:
        converted = to_dict(record)
        record_map = converted if isinstance(converted, dict) else {}

    admin_user = None
    user_dict = None

    if isinstance(record, dict) and record.get("user"):
        admin_user = record["user"]
    elif hasattr(record, "user"):
        admin_user = getattr(record, "user")

    if admin_user is not None:
        candidate = admin_user if isinstance(admin_user, dict) else to_dict(admin_user)
        if isinstance(candidate, dict):
            user_dict = candidate

    items_payload = record_map.get("items") if record_map else getattr(record, "items", None)
    shipping_payload = record_map.get("shipping_address") if record_map else getattr(record, "shipping_address", None)

    record_id = record_map.get("id")
    if record_id is None:
        record_id = getattr(record, "id", None)

    user_id_value = record_map.get("user_id")
    if user_id_value is None:
        user_id_value = getattr(record, "user_id", "")

    status_value = record_map.get("status")
    if status_value is None:
        status_value = getattr(record, "status", None)

    currency_value = record_map.get("currency")
    if currency_value is None:
        currency_value = getattr(record, "currency", None)

    total_cost_value = record_map.get("total_cost")
    if total_cost_value is None:
        total_cost_value = getattr(record, "total_cost", 0)

    created_at_value = record_map.get("created_at")
    if created_at_value is None:
        created_at_value = getattr(record, "created_at", None)
# added
    payment_status_value = record_map.get("payment_status")
    if payment_status_value is None:
        payment_status_value = getattr(record, "payment_status", "Не оплачен")

    tracking_code_value = record_map.get("tracking_code")
    if tracking_code_value is None:
        tracking_code_value = getattr(record, "tracking_code", None)

    # return OrderResult(
    #     id=int(record_id),
    #     user_id=str(user_id_value or ""),
    #     user=make_order_user(record_map, user_dict or {}),
    #     status=status_value or DEFAULT_ORDER_STATUS,
    #     currency=currency_value or DEFAULT_CURRENCY,
    #     total_cost=int(total_cost_value or 0),
    #     items=normalize_items(items_payload),
    #     shipping_address=normalize_shipping(shipping_payload),
    #     created_at=parse_datetime(created_at_value),
    # )
    return OrderResult(
        id=int(record_id),
        user_id=str(user_id_value or ""),
        user=make_order_user(record_map, user_dict or {}),
        status=status_value or DEFAULT_ORDER_STATUS,
        currency=currency_value or DEFAULT_CURRENCY,
        total_cost=int(total_cost_value or 0),
        items=normalize_items(items_payload),
        shipping_address=normalize_shipping(shipping_payload),
        payment_status=payment_status_value or "Не оплачен",
        tracking_code=str(tracking_code_value) if tracking_code_value else None,
        created_at=parse_datetime(created_at_value),
    )



def fetch_user_profile(user_id: Any) -> Dict[str, Any] | None:
    if not user_id:
        return None

    user_id_str = str(user_id)

    try:
        response = supabase.auth.admin.get_user_by_id(user_id_str)
    except Exception:
        return None

    user_obj = getattr(response, "user", None)
    user_dict = to_dict(user_obj)
    if isinstance(user_dict, dict):
        if "id" not in user_dict and user_id_str:
            user_dict["id"] = user_id_str
        return user_dict
    return None


def attach_user(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    enriched: List[Dict[str, Any]] = []
    cache: Dict[str, Dict[str, Any] | None] = {}

    for record in records:
        user_id = record.get("user_id")
        if user_id:
            if user_id not in cache:
                profile = fetch_user_profile(user_id)
                if not profile:
                    profile = fallback_user_from_record(record)
                cache[user_id] = profile
            profile_payload = cache[user_id]
            if profile_payload:
                record = {**record, "user": profile_payload}
        else:
            fallback = fallback_user_from_record(record)
            if fallback:
                record = {**record, "user": fallback}
        enriched.append(record)

    return enriched

