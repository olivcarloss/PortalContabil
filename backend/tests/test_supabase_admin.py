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


def test_invite_user_success(monkeypatch):
    monkeypatch.setattr(
        httpx, "post", lambda *a, **k: FakeResponse(200, {"id": "user-1"})
    )
    user_id, is_new = supabase_admin.invite_user("new@example.com", "Nova Pessoa")
    assert (user_id, is_new) == ("user-1", True)


def test_invite_user_duplicate_reuses_existing(monkeypatch):
    monkeypatch.setattr(
        httpx,
        "post",
        lambda *a, **k: FakeResponse(422, {"msg": "Email address already registered"}),
    )
    monkeypatch.setattr(
        httpx,
        "get",
        lambda *a, **k: FakeResponse(
            200, {"users": [{"id": "existing-1", "email": "dup@example.com"}]}
        ),
    )
    user_id, is_new = supabase_admin.invite_user("dup@example.com", "Pessoa")
    assert (user_id, is_new) == ("existing-1", False)


def test_invite_user_generic_error_raises(monkeypatch):
    monkeypatch.setattr(
        httpx, "post", lambda *a, **k: FakeResponse(500, {"msg": "Internal error"})
    )
    with pytest.raises(supabase_admin.SupabaseAdminError, match="Internal error"):
        supabase_admin.invite_user("fail@example.com", "Pessoa")


def test_get_users_status_maps_confirmed_and_pending(monkeypatch):
    responses = {
        "u1": FakeResponse(200, {"id": "u1", "email_confirmed_at": "2026-01-01T00:00:00Z"}),
        "u2": FakeResponse(200, {"id": "u2", "email_confirmed_at": None}),
    }

    def fake_get(url, *a, **k):
        user_id = url.rsplit("/", 1)[-1]
        return responses[user_id]

    monkeypatch.setattr(httpx, "get", fake_get)
    result = supabase_admin.get_users_status(["u1", "u2"])
    assert result == {"u1": "ativo", "u2": "pendente"}
