import asyncio
import math
import time
from typing import Any, Dict, List, Optional, Union
import httpx
from fastapi import HTTPException

from backend.app.config import EVOTOR_STORE_UUID, EVOTOR_TOKEN

BASE_URL = "https://api.evotor.ru"
PRODUCTS_PATH = f"/stores/{EVOTOR_STORE_UUID}/products"
GROUPS_PATH = f"/stores/{EVOTOR_STORE_UUID}/product-groups"
CACHE_TTL_SECONDS = 60
HTTPX_TIMEOUT = httpx.Timeout(connect=10.0, read=30.0, write=10.0, pool=10.0)

_products_cache: Dict[str, Any] = {"timestamp": 0.0, "data": []}
_groups_cache: Dict[str, Any] = {"timestamp": 0.0, "data": []}

_products_lock = asyncio.Lock()
_groups_lock = asyncio.Lock()


def paginate(items: List[Dict[str, Any]], page: int, page_size: int) -> List[Dict[str, Any]]:
    start = (page - 1) * page_size
    end = start + page_size
    return items[start:end]


def build_headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {EVOTOR_TOKEN}",
        "Accept": "application/json",
    }


def is_cache_valid(cache: Dict[str, Any]) -> bool:
    timestamp = cache.get("timestamp") or 0.0
    return (time.monotonic() - float(timestamp)) < CACHE_TTL_SECONDS and cache.get("data")


def extract_next_cursor(payload: Dict[str, Any], previous: Optional[str]) -> Optional[str]:
    paging = payload.get("paging")
    if isinstance(paging, dict):
        candidate = paging.get("next_cursor") or paging.get("cursor")
        if isinstance(candidate, str) and candidate and candidate != previous:
            return candidate
    return None


async def fetch_paginated(path: str) -> List[Dict[str, Any]]:
    headers = build_headers()
    collected: List[Dict[str, Any]] = []
    cursor: Optional[str] = None

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=HTTPX_TIMEOUT) as client:
        while True:
            params = {"cursor": cursor} if cursor else None
            try:
                response = await client.get(path, headers=headers, params=params)
            except httpx.RequestError as exc:
                raise HTTPException(status_code=502, detail="Не удалось подключиться к Evotor API.") from exc

            if response.status_code == 401:
                raise HTTPException(status_code=502, detail="Evotor API отклонил токен авторизации.")

            if response.status_code >= 400:
                raise HTTPException(
                    status_code=502,
                    detail=f"Evotor API вернул ошибку {response.status_code}.",
                )

            payload = response.json()
            items = payload.get("items")
            if isinstance(items, list):
                collected.extend(item for item in items if isinstance(item, dict))

            next_cursor = extract_next_cursor(payload, previous=cursor)
            if not next_cursor:
                break

            cursor = next_cursor

    return collected


def normalize_group(raw: Dict[str, Any]) -> Optional[Dict[str, str]]:
    group_id = raw.get("id")
    name = raw.get("name")
    if not isinstance(group_id, str) or not group_id:
        return None
    if not isinstance(name, str):
        name = ""
    return {"id": group_id, "name": name.strip()}


def normalize_product(raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    product_id = raw.get("id")
    name = raw.get("name")
    quantity = raw.get("quantity")
    price = raw.get("price")
    allow_to_sell = raw.get("allow_to_sell", True)

    if not isinstance(product_id, str) or not product_id:
        return None

    if not isinstance(name, str) or not name.strip():
        name = "Без названия"
    else:
        name = name.strip()

    try:
        qty_value = float(quantity)
    except (TypeError, ValueError):
        qty_value = 0.0

    if qty_value <= 0 or not allow_to_sell:
        return None

    try:
        price_value = float(price)
    except (TypeError, ValueError):
        price_value = 0.0

    return {
        "id": product_id,
        "name": name,
        "price": price_value,
        "quantity": qty_value,
        "parent_id": raw.get("parent_id"),
        "measure_name": raw.get("measure_name"),
    }


async def get_product_groups(force_refresh: bool = False) -> List[Dict[str, str]]:
    async with _groups_lock:
        if not force_refresh and is_cache_valid(_groups_cache):
            return _groups_cache["data"]

        raw_groups = await fetch_paginated(GROUPS_PATH)
        normalized = [normalize_group(group) for group in raw_groups]
        groups = [group for group in normalized if group is not None]

        _groups_cache["data"] = groups
        _groups_cache["timestamp"] = time.monotonic()

        return groups


async def get_products(force_refresh: bool = False) -> List[Dict[str, Any]]:
    async with _products_lock:
        if not force_refresh and is_cache_valid(_products_cache):
            return _products_cache["data"]

        raw_products = await fetch_paginated(PRODUCTS_PATH)
        normalized = [normalize_product(product) for product in raw_products]
        products = [product for product in normalized if product is not None]

        _products_cache["data"] = products
        _products_cache["timestamp"] = time.monotonic()

        return products


def _invalidate_products_cache() -> None:
    _products_cache["timestamp"] = 0.0


async def fetch_product(product_id: str) -> Optional[Dict[str, Any]]:
    headers = build_headers()

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=HTTPX_TIMEOUT) as client:
        try:
            response = await client.get(f"{PRODUCTS_PATH}/{product_id}", headers=headers)
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail="Не удалось получить товар в Evotor.") from exc

    if response.status_code == 404:
        return None

    if response.status_code == 401:
        raise HTTPException(status_code=502, detail="Evotor API отклонил токен авторизации.")

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Evotor API вернул ошибку {response.status_code} при получении товара.",
        )

    payload = response.json()
    return payload if isinstance(payload, dict) else None


async def update_product_quantity(product_id: str, quantity: Union[float, int]) -> None:
    try:
        quantity_value = float(quantity)
    except (TypeError, ValueError):
        raise HTTPException(status_code=500, detail="Некорректно рассчитан остаток товара.") from None

    if not math.isfinite(quantity_value):
        raise HTTPException(status_code=500, detail="Некорректно рассчитан остаток товара.")

    if quantity_value < 0:
        quantity_value = 0.0

    if float(quantity_value).is_integer():
        payload_quantity: Union[int, float] = int(quantity_value)
    else:
        payload_quantity = round(quantity_value, 6)

    headers = build_headers()

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=HTTPX_TIMEOUT) as client:
        try:
            response = await client.patch(
                f"{PRODUCTS_PATH}/{product_id}",
                headers=headers,
                json={"quantity": payload_quantity},
            )
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail="Не удалось обновить товар в Evotor.") from exc

    if response.status_code == 401:
        raise HTTPException(status_code=502, detail="Evotor API отклонил токен авторизации.")

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Evotor API вернул ошибку {response.status_code} при обновлении товара.",
        )

    _invalidate_products_cache()
