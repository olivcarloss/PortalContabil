import httpx
import pytest

from app.core import supabase_admin


class FakeResponse:
    def __init__(self, status_code: int, json_body: dict):
        self.status_code = status_code
        self._json_body = json_body
        self.content = b"1"
        self.text = str(json_body)

    def json(self):
        return self._json_body


def test_create_user_with_password_success(monkeypatch):
    monkeypatch.setattr(
        httpx, "post", lambda *a, **k: FakeResponse(200, {"id": "user-1"})
    )
    user_id = supabase_admin.create_user_with_password(
        "new@example.com", "Nova Pessoa", "senha12345"
    )
    assert user_id == "user-1"


def test_create_user_with_password_error_raises(monkeypatch):
    monkeypatch.setattr(
        httpx,
        "post",
        lambda *a, **k: FakeResponse(422, {"msg": "Email address already registered"}),
    )
    with pytest.raises(supabase_admin.SupabaseAdminError, match="already registered"):
        supabase_admin.create_user_with_password("dup@example.com", "Pessoa", "senha12345")


def test_set_user_password_success(monkeypatch):
    monkeypatch.setattr(
        httpx, "put", lambda *a, **k: FakeResponse(200, {"id": "user-1"})
    )
    supabase_admin.set_user_password("user-1", "novaSenha123")


def test_set_user_password_error_raises(monkeypatch):
    monkeypatch.setattr(
        httpx, "put", lambda *a, **k: FakeResponse(500, {"msg": "Internal error"})
    )
    with pytest.raises(supabase_admin.SupabaseAdminError, match="Internal error"):
        supabase_admin.set_user_password("user-1", "novaSenha123")


def test_get_users_meta_maps_confirmed_pending_and_email(monkeypatch):
    page = FakeResponse(
        200,
        {
            "users": [
                {"id": "u1", "email": "u1@example.com", "email_confirmed_at": "2026-01-01T00:00:00Z"},
                {"id": "u2", "email": "u2@example.com", "email_confirmed_at": None},
                {"id": "u3", "email": "u3@example.com", "email_confirmed_at": "2026-01-01T00:00:00Z"},
            ]
        },
    )
    calls = []

    def fake_get(url, *a, **k):
        calls.append(k.get("params"))
        return page

    monkeypatch.setattr(httpx, "get", fake_get)
    result = supabase_admin.get_users_meta(["u1", "u2"])
    assert result == {
        "u1": {"convite_status": "ativo", "email": "u1@example.com"},
        "u2": {"convite_status": "pendente", "email": "u2@example.com"},
    }
    # A single request should cover the whole batch — no per-user round trip.
    assert len(calls) == 1


def test_get_users_meta_paginates_until_all_ids_found(monkeypatch):
    page1 = FakeResponse(200, {"users": [{"id": f"u{i}", "email": f"u{i}@x.com", "email_confirmed_at": "2026-01-01"} for i in range(200)]})
    page2 = FakeResponse(200, {"users": [{"id": "u200", "email": "u200@x.com", "email_confirmed_at": None}]})
    pages = [page1, page2]

    def fake_get(url, *a, **k):
        return pages.pop(0)

    monkeypatch.setattr(httpx, "get", fake_get)
    result = supabase_admin.get_users_meta(["u0", "u200"])
    assert result["u0"]["convite_status"] == "ativo"
    assert result["u200"] == {"convite_status": "pendente", "email": "u200@x.com"}


def test_get_users_meta_defaults_to_pendente_when_id_not_found(monkeypatch):
    monkeypatch.setattr(httpx, "get", lambda *a, **k: FakeResponse(200, {"users": []}))
    result = supabase_admin.get_users_meta(["ghost"])
    assert result == {"ghost": {"convite_status": "pendente", "email": None}}


def test_update_user_email_success(monkeypatch):
    monkeypatch.setattr(httpx, "put", lambda *a, **k: FakeResponse(200, {"id": "user-1"}))
    supabase_admin.update_user_email("user-1", "novo@example.com")


def test_update_user_email_error_raises(monkeypatch):
    monkeypatch.setattr(
        httpx, "put", lambda *a, **k: FakeResponse(422, {"msg": "Email address already registered"})
    )
    with pytest.raises(supabase_admin.SupabaseAdminError, match="already registered"):
        supabase_admin.update_user_email("user-1", "dup@example.com")
