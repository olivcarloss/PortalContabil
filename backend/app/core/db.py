from contextlib import contextmanager

from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row

from app.core.config import settings

pool = ConnectionPool(
    conninfo=settings.database_url,
    min_size=1,
    max_size=10,
    kwargs={"row_factory": dict_row},
)


@contextmanager
def get_conn():
    with pool.connection() as conn:
        yield conn
