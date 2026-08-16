from contextlib import contextmanager

from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row

from app.core.config import settings

pool = ConnectionPool(
    conninfo=settings.database_url,
    min_size=1,
    max_size=10,
    # Supabase's pooler runs PgBouncer in transaction mode: a "prepared" server-side
    # statement can silently end up on a different backend connection on the next
    # use, raising psycopg.errors.InvalidSqlStatementName. Disabling psycopg's
    # autoprepare avoids that class of failure entirely.
    kwargs={"row_factory": dict_row, "prepare_threshold": None},
)


@contextmanager
def get_conn():
    with pool.connection() as conn:
        yield conn
