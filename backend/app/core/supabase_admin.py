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


def create_user_with_password(email: str, nome: str, senha: str) -> str:
    """Creates the auth.users account with the password set by the admin,
    already confirmed (no e-mail step needed to log in). Returns the new
    auth_user_id."""
    resp = httpx.post(
        f"{settings.supabase_url}/auth/v1/admin/users",
        headers=_headers(),
        json={
            "email": email,
            "password": senha,
            "email_confirm": True,
            "user_metadata": {"nome": nome},
        },
        timeout=10,
    )
    if resp.status_code in (200, 201):
        return resp.json()["id"]

    body = resp.json() if resp.content else {}
    message = body.get("msg") or body.get("message") or body.get("error_description") or resp.text
    raise SupabaseAdminError(message)


def set_user_password(user_id: str, senha: str) -> None:
    """Sets a user's password directly (admin-defined, no e-mail step)."""
    resp = httpx.put(
        f"{settings.supabase_url}/auth/v1/admin/users/{user_id}",
        headers=_headers(),
        json={"password": senha},
        timeout=10,
    )
    if resp.status_code != 200:
        body = resp.json() if resp.content else {}
        message = body.get("msg") or body.get("message") or body.get("error_description") or resp.text
        raise SupabaseAdminError(message)


def send_password_reset(user_id: str) -> None:
    """Sends Supabase's built-in "Reset Password" e-mail to the user's
    registered address, so an admin can request a password change without
    ever seeing/handling the user's actual password."""
    resp = httpx.get(
        f"{settings.supabase_url}/auth/v1/admin/users/{user_id}",
        headers=_headers(),
        timeout=10,
    )
    if resp.status_code != 200:
        raise SupabaseAdminError("Usuario nao encontrado na autenticacao")
    email = resp.json().get("email")
    if not email:
        raise SupabaseAdminError("Usuario nao possui e-mail cadastrado")

    resp = httpx.post(
        f"{settings.supabase_url}/auth/v1/recover",
        headers=_headers(),
        params={"redirect_to": f"{settings.frontend_origin}/redefinir-senha"},
        json={"email": email},
        timeout=10,
    )
    if resp.status_code not in (200, 204):
        body = resp.json() if resp.content else {}
        message = body.get("msg") or body.get("message") or resp.text
        raise SupabaseAdminError(message)


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
