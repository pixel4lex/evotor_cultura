import math
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query

from backend.app.services.catalog_service import get_products, get_product_groups, paginate

router = APIRouter(prefix="", tags=["catalog"])


@router.get("/items")
async def list_items(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    group_id: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None, min_length=1),
) -> Dict[str, Any]:
    products = await get_products()
    groups = await get_product_groups()
    group_map = {group["id"]: group["name"] for group in groups}

    if group_id:
        products = [product for product in products if product.get("parent_id") == group_id]

    if search:
        normalized_query = search.strip().lower()
        if normalized_query:
            products = [
                product
                for product in products
                if normalized_query in product["name"].lower()
                or normalized_query in (group_map.get(product.get("parent_id"), "") or "").lower()
            ]

    total = len(products)
    total_pages = math.ceil(total / page_size) if total else 0

    page_items = paginate(products, page, page_size) if products else []

    result_items: List[Dict[str, Any]] = []
    for item in page_items:
        result_items.append(
            {
                "id": item["id"],
                "name": item["name"],
                "price": item["price"],
                "quantity": item["quantity"],
                "group_id": item.get("parent_id"),
                "group_name": group_map.get(item.get("parent_id")),
                "measure_name": item.get("measure_name"),
            }
        )

    return {
        "items": result_items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }


@router.get("/groups")
async def list_groups() -> Dict[str, Any]:
    groups = await get_product_groups()
    return {"items": groups}