"""Verifica se o usuario autenticado tem licenca ativa do produto
'Conciliação Contábil' (CONCILIACAO_CONTABIL) para os CNPJs que esta consultando.
"""
from fastapi import HTTPException, status

CONCILIACAO_PRODUTO_CODIGO = "CONCILIACAO_CONTABIL"


def get_cnpjs_liberados(conn, usuario_id: str) -> list[str]:
    """Retorna a lista de cnpj_id (como str) para os quais o usuario tem
    uma licenca ativa do produto de Conciliacao Contabil."""
    with conn.cursor() as cur:
        cur.execute(
            """
            select l.cnpj_id
            from usuario_licencas ul
            join licencas l on l.id = ul.licenca_id
            join produtos p on p.id = l.produto_id
            where ul.usuario_id = %s
              and p.codigo = %s
              and l.status = 'ativa'
              and l.cnpj_id is not null;
            """,
            (usuario_id, CONCILIACAO_PRODUTO_CODIGO),
        )
        return [str(row["cnpj_id"]) for row in cur.fetchall()]


def require_cnpjs_liberados(conn, usuario_id: str) -> list[str]:
    cnpj_ids = get_cnpjs_liberados(conn, usuario_id)
    if not cnpj_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario nao possui licenca ativa de Conciliacao Contabil para nenhum CNPJ",
        )
    return cnpj_ids


def get_modulos_liberados(conn, usuario_id: str) -> list[str]:
    """Retorna os codigos dos modulos (ex.: RELATORIO_SINTETICO, RELATORIO_ANALITICO)
    liberados para o usuario, considerando todas as suas licencas ativas de
    Conciliacao Contabil. Um modulo aparece liberado se estiver habilitado em
    QUALQUER uma das licencas ativas do usuario para o produto."""
    with conn.cursor() as cur:
        cur.execute(
            """
            select distinct m.codigo
            from usuario_licencas ul
            join licencas l on l.id = ul.licenca_id
            join produtos p on p.id = l.produto_id
            join licenca_modulos lm on lm.licenca_id = l.id
            join modulos m on m.id = lm.modulo_id
            where ul.usuario_id = %s
              and p.codigo = %s
              and l.status = 'ativa';
            """,
            (usuario_id, CONCILIACAO_PRODUTO_CODIGO),
        )
        return [row["codigo"] for row in cur.fetchall()]
