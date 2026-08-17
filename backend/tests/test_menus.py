from app.modules.licensing.menus import ALL_MENU_CODES, get_menus_liberados


class FakeCursor:
    def __init__(self, responses):
        # responses: list of (fetchone_result, fetchall_result), consumed in order
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


def test_is_admin_bypasses_and_returns_every_menu():
    conn = FakeConn([({"is_admin": True}, [])])
    assert get_menus_liberados(conn, "user-1") == set(ALL_MENU_CODES)


def test_non_admin_gets_union_of_granted_menus():
    conn = FakeConn(
        [
            ({"is_admin": False}, []),
            (None, [{"menu_codigo": "portal_contabil"}, {"menu_codigo": "licenciamento_produtos"}]),
        ]
    )
    assert get_menus_liberados(conn, "user-2") == {"portal_contabil", "licenciamento_produtos"}


def test_no_usuarios_portal_row_and_no_grants_returns_empty_set():
    conn = FakeConn([(None, []), (None, [])])
    assert get_menus_liberados(conn, "user-3") == set()
