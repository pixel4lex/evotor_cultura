from typing import Dict, Any
from fastapi import HTTPException, Header

from backend.app.db import supabase
from backend.app.services.db_service import to_dict


ADMIN_FLAG_KEYS = {"is_admin", "admin", "role"}


def extract_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing.")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header.")

    return token


async def current_user(authorization: str = Header(default=None)) -> Dict[str, Any]:
    token = extract_token(authorization)

    try:
        response = supabase.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token.") from exc

    user_dict = to_dict(response.user)
    if not user_dict:
        raise HTTPException(status_code=401, detail="Пользователь не найден.")

    return user_dict


def is_admin(user: Dict[str, Any]) -> bool:
    """
    1. Сначала пробуем прочитать роль из public.profiles
    2. Если не получилось / нет записи — падаем обратно на user_metadata
    """

    user_id = user.get("id")

    # 1) Пробуем взять роль из таблицы profiles
    if user_id:
        try:
            response = (
                supabase.table("profiles")
                .select("role")
                .eq("id", user_id)
                .limit(1)
                .execute()
            )
            rows = getattr(response, "data", None) or []
            if rows:
                role = rows[0].get("role")
                if isinstance(role, str) and role.lower() == "admin":
                    return True
        except Exception as exc:
            # Логируем, но не ломаемся — просто пойдём по старой логике
            print(f"Не удалось получить профиль для проверки администратора: {exc}")

    # 2) Старое поведение: смотрим в user_metadata
    metadata = user.get("user_metadata") or {}
    if not isinstance(metadata, dict):
        return False

    # Явный флаг is_admin
    if metadata.get("is_admin"):
        return True

    # Строковое поле role: "admin"
    role_value = metadata.get("role")
    if isinstance(role_value, str) and role_value.lower() == "admin":
        return True

    # Любое поле из ADMIN_FLAG_KEYS == "1"/"true"/"yes"/"admin"
    for key in ADMIN_FLAG_KEYS:
        value = metadata.get(key)
        if isinstance(value, str) and value.lower() in {"1", "true", "yes", "admin"}:
            return True

    return False


async def current_admin(authorization: str = Header(default=None)) -> Dict[str, Any]:
    user = await current_user(authorization=authorization)

    if not is_admin(user):
        raise HTTPException(status_code=403, detail="Недостаточно прав для выполнения действия.")

    return user
