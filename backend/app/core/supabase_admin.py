import httpx

from app.core.config import settings


class SupabaseAdminError(Exception):
    def __init__(self, message: str, already_registered: bool = False):
        super().__init__(message)
        self.message = message
        self.already_registered = already_registered


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
    already = resp.status_code == 422 and "already been registered" in message.lower()
    raise SupabaseAdminError(message, already_registered=already)


def get_user_id_by_email(email: str) -> str | None:
    """Busca o auth_user_id de um e-mail ja existente na autenticacao —
    usado quando uma tentativa de criar conta nova esbarra em "already
    registered": a pessoa ja tem login no Supabase Auth, so falta o perfil
    dela em usuarios_portal (ex.: convite anterior que nao completou)."""
    resp = httpx.get(
        f"{settings.supabase_url}/auth/v1/admin/users",
        headers=_headers(),
        params={"per_page": 200},
        timeout=10,
    )
    if resp.status_code != 200:
        return None
    email_lower = email.strip().lower()
    for u in resp.json().get("users", []):
        if (u.get("email") or "").lower() == email_lower:
            return u["id"]
    return None


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


def get_users_meta(ids: list[str]) -> dict[str, dict]:
    """Returns {id: {"convite_status": "pendente"|"ativo", "email": str|None}}
    for each auth.users id, based on whether the invite has been accepted
    (email_confirmed_at set)."""
    result: dict[str, dict] = {}
    for user_id in ids:
        resp = httpx.get(
            f"{settings.supabase_url}/auth/v1/admin/users/{user_id}",
            headers=_headers(),
            timeout=10,
        )
        if resp.status_code != 200:
            result[user_id] = {"convite_status": "pendente", "email": None}
            continue
        user = resp.json()
        result[user_id] = {
            "convite_status": "ativo" if user.get("email_confirmed_at") else "pendente",
            "email": user.get("email"),
        }
    return result


def update_user_email(user_id: str, email: str) -> None:
    """Updates a user's login e-mail in Supabase Auth. Supabase re-confirms
    the new address automatically (no e-mail step needed) since this is an
    admin-initiated change."""
    resp = httpx.put(
        f"{settings.supabase_url}/auth/v1/admin/users/{user_id}",
        headers=_headers(),
        json={"email": email, "email_confirm": True},
        timeout=10,
    )
    if resp.status_code != 200:
        body = resp.json() if resp.content else {}
        message = body.get("msg") or body.get("message") or body.get("error_description") or resp.text
        raise SupabaseAdminError(message)


def delete_user(user_id: str) -> None:
    """Removes the auth.users account entirely — used only when the portal
    profile itself is being hard-deleted (no history to preserve), so the
    e-mail becomes free to register again instead of tripping "already
    registered" on the next invite attempt."""
    resp = httpx.delete(
        f"{settings.supabase_url}/auth/v1/admin/users/{user_id}",
        headers=_headers(),
        timeout=10,
    )
    if resp.status_code not in (200, 204):
        body = resp.json() if resp.content else {}
        message = body.get("msg") or body.get("message") or body.get("error_description") or resp.text
        raise SupabaseAdminError(message)
