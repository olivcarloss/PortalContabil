import pytest
from fastapi import HTTPException

from app.modules.licensing.escopo import get_escopo, require_escopo_cliente, require_papel_master


class FakeCursor:
    def __init__(self, responses):
        self._responses = list(responses)
        self._current = None

    def execute(self, sql, params=None):
        self._current = self._responses.pop(0)

    def fetchone(self):
        return self._current[0]

    def fetchall(self):
        return self._current[1]

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


class FakeConn:
    def __init__(self, responses):
        self._cursor = FakeCursor(responses)

    def cursor(self):
        return self._cursor


def test_get_escopo_master_has_no_cliente_restriction():
    conn = FakeConn([({"papel": "master"}, [])])
    papel, clientes = get_escopo(conn, "user-1")
    assert papel == "master"
    assert clientes == set()


def test_get_escopo_administrador_returns_assigned_clientes():
    conn = FakeConn(
        [
            ({"papel": "administrador"}, []),
            (None, [{"cliente_id": "c1"}, {"cliente_id": "c2"}]),
        ]
    )
    papel, clientes = get_escopo(conn, "user-2")
    assert papel == "administrador"
    assert clientes == {"c1", "c2"}


def test_get_escopo_usuario_has_empty_scope_without_extra_query():
    conn = FakeConn([({"papel": "usuario"}, [])])
    papel, clientes = get_escopo(conn, "user-3")
    assert papel == "usuario"
    assert clientes == set()


def test_require_escopo_cliente_allows_master_for_any_cliente():
    require_escopo_cliente("c1", "master", set())


def test_require_escopo_cliente_allows_administrador_inside_scope():
    require_escopo_cliente("c1", "administrador", {"c1", "c2"})


def test_require_escopo_cliente_blocks_administrador_outside_scope():
    with pytest.raises(HTTPException) as exc:
        require_escopo_cliente("c3", "administrador", {"c1", "c2"})
    assert exc.value.status_code == 403


def test_require_escopo_cliente_blocks_usuario():
    with pytest.raises(HTTPException) as exc:
        require_escopo_cliente("c1", "usuario", set())
    assert exc.value.status_code == 403


def test_require_papel_master_allows_master():
    require_papel_master("master")


def test_require_papel_master_blocks_administrador():
    with pytest.raises(HTTPException) as exc:
        require_papel_master("administrador")
    assert exc.value.status_code == 403
