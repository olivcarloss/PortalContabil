import httpx

from app.core.config import settings


class SupabaseAdminError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def _headers() -> dict[str, str]:
    return {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
    }


def invite_user(email: str, nome: str) -> tuple[str, bool]:
    """Creates the auth.users account and triggers Supabase's invite e-mail.

    Returns (auth_user_id, is_new). If the e-mail is already registered,
    reuses the existing account instead of erroring (is_new=False).
    """
    resp = httpx.post(
        f"{settings.supabase_url}/auth/v1/invite",
        headers=_headers(),
        params={"redirect_to": f"{settings.frontend_origin}/aceitar-convite"},
        json={"email": email, "data": {"nome": nome}},
        timeout=10,
    )
    if resp.status_code in (200, 201):
        return resp.json()["id"], True

    body = resp.json() if resp.content else {}
    message = body.get("msg") or body.get("message") or body.get("error_description") or resp.text
    if resp.status_code == 422 and "already" in message.lower():
        existing_id = _find_user_id_by_email(email)
        if existing_id:
            return existing_id, False

    raise SupabaseAdminError(message)


def _find_user_id_by_email(email: str) -> str | None:
    resp = httpx.get(
        f"{settings.supabase_url}/auth/v1/admin/users",
        headers=_headers(),
        params={"email": email},
        timeout=10,
    )
    if resp.status_code != 200:
        return None
    users = resp.json().get("users", [])
    for user in users:
        if user.get("email", "").lower() == email.lower():
            return user["id"]
    return None


def get_users_status(ids: list[str]) -> dict[str, str]:
    """Returns {id: "pendente" | "ativo"} for each auth.users id, based on
    whether the invite has been accepted (email_confirmed_at set)."""
    result: dict[str, str] = {}
    for user_id in ids:
        resp = httpx.get(
            f"{settings.supabase_url}/auth/v1/admin/users/{user_id}",
            headers=_headers(),
            timeout=10,
        )
        if resp.status_code != 200:
            result[user_id] = "pendente"
            continue
        user = resp.json()
        result[user_id] = "ativo" if user.get("email_confirmed_at") else "pendente"
    return result
