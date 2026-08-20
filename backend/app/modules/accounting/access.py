"""Verifica se o usuario autenticado tem licenca ativa do produto
'Conciliação Contábil' (CONCILIACAO_CONTABIL) para os CNPJs que esta consultando.
"""
from fastapi import HTTPException, status

from app.modules.licensing.escopo import get_escopo
from app.modules.licensing.renovacao import renovar_licencas_vencidas

CONCILIACAO_PRODUTO_CODIGO = "CONCILIACAO_CONTABIL"


def get_cnpjs_liberados(conn, usuario_id: str) -> list[str]:
    """Retorna a lista de cnpj_id (como str) para os quais o usuario alcanca
    o produto de Conciliacao Contabil — master ve todos os CNPJs com licenca
    ativa do produto, administrador so os dos escritorios que administra, e
    usuario comum so os que tem via usuario_licencas (allowlist explicita)."""
    renovar_licencas_vencidas(conn)
    papel, escopo = get_escopo(conn, usuario_id)
    with conn.cursor() as cur:
        if papel == "master":
            cur.execute(
                """
                select l.cnpj_id
                from licencas l
                join produtos p on p.id = l.produto_id
                where p.codigo = %s and l.status = 'ativa' and l.cnpj_id is not null;
                """,
                (CONCILIACAO_PRODUTO_CODIGO,),
            )
            return [str(row["cnpj_id"]) for row in cur.fetchall()]

        if papel == "administrador":
            cur.execute(
                """
                select l.cnpj_id
                from licencas l
                join produtos p on p.id = l.produto_id
                where p.codigo = %s and l.status = 'ativa' and l.cnpj_id is not null
                  and l.cliente_id = any(%s::uuid[]);
                """,
                (CONCILIACAO_PRODUTO_CODIGO, list(escopo)),
            )
            return [str(row["cnpj_id"]) for row in cur.fetchall()]

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
    liberados para o usuario. Master ve todos os modulos habilitados em
    qualquer licenca ativa de Conciliacao Contabil; demais papeis continuam
    na allowlist POR USUARIO (usuario_modulos) — um modulo so aparece se
    tiver sido concedido explicitamente a esse usuario para aquela licenca,
    independente de estar habilitado na licenca em si (licenca_modulos)."""
    renovar_licencas_vencidas(conn)
    papel, _ = get_escopo(conn, usuario_id)
    with conn.cursor() as cur:
        if papel == "master":
            cur.execute(
                """
                select distinct m.codigo
                from licenca_modulos lm
                join licencas l on l.id = lm.licenca_id
                join produtos p on p.id = l.produto_id
                join modulos m on m.id = lm.modulo_id
                where p.codigo = %s and l.status = 'ativa';
                """,
                (CONCILIACAO_PRODUTO_CODIGO,),
            )
            return [row["codigo"] for row in cur.fetchall()]

        cur.execute(
            """
            select distinct m.codigo
            from usuario_modulos um
            join licencas l on l.id = um.licenca_id
            join produtos p on p.id = l.produto_id
            join modulos m on m.id = um.modulo_id
            where um.usuario_id = %s
              and p.codigo = %s
              and l.status = 'ativa';
            """,
            (usuario_id, CONCILIACAO_PRODUTO_CODIGO),
        )
        return [row["codigo"] for row in cur.fetchall()]
