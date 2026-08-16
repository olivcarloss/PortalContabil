from app.modules.licensing.renovacao import renovar_licencas_vencidas, _RENOVAR_SQL


class FakeCursor:
    def __init__(self, rows):
        self._rows = rows
        self.executed_sql = None

    def execute(self, sql):
        self.executed_sql = sql

    def fetchall(self):
        return self._rows

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


class FakeConn:
    def __init__(self, rows):
        self._cursor = FakeCursor(rows)
        self.committed = False

    def cursor(self):
        return self._cursor

    def commit(self):
        self.committed = True


def test_renovar_licencas_vencidas_runs_batch_update_and_commits():
    conn = FakeConn(rows=[{"id": "l1"}, {"id": "l2"}])
    count = renovar_licencas_vencidas(conn)
    assert count == 2
    assert conn.committed is True
    assert conn._cursor.executed_sql == _RENOVAR_SQL


def test_renovar_licencas_vencidas_returns_zero_when_nothing_expired():
    conn = FakeConn(rows=[])
    assert renovar_licencas_vencidas(conn) == 0
    assert conn.committed is True


def test_sql_only_targets_ativa_status_with_past_data_fim():
    assert "status = 'ativa'" in _RENOVAR_SQL
    assert "data_fim is not null" in _RENOVAR_SQL
    assert "data_fim < current_date" in _RENOVAR_SQL


def test_sql_increments_by_periodicidade():
    assert "when 'anual' then 365" in _RENOVAR_SQL
    assert "interval '1 year'" in _RENOVAR_SQL
    assert "interval '1 month'" in _RENOVAR_SQL
