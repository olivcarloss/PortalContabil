from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.db import get_conn
from app.core.security import CurrentUser, get_current_user
from app.modules.accounting.access import get_modulos_liberados, require_cnpjs_liberados
from app.schemas.accounting import ConciliacaoSintetico, LancamentoAnalitico

router = APIRouter(prefix="/accounting", tags=["accounting"])


@router.get("/meus-modulos", response_model=list[str])
def meus_modulos(user: CurrentUser = Depends(get_current_user)):
    with get_conn() as conn:
        return get_modulos_liberados(conn, user.id)


@router.get("/conciliacoes", response_model=list[ConciliacaoSintetico])
def list_conciliacoes(user: CurrentUser = Depends(get_current_user)):
    with get_conn() as conn:
        cnpj_ids = require_cnpjs_liberados(conn, user.id)
        with conn.cursor() as cur:
            cur.execute(
                """
                select * from vw_conciliacoes_sintetico
                where cnpj_id = any(%s::uuid[])
                order by ano desc, mes desc;
                """,
                (cnpj_ids,),
            )
            return cur.fetchall()


@router.get("/conciliacoes/{conciliacao_id}/lancamentos", response_model=list[LancamentoAnalitico])
def list_lancamentos(
    conciliacao_id: UUID, user: CurrentUser = Depends(get_current_user)
):
    with get_conn() as conn:
        cnpj_ids = require_cnpjs_liberados(conn, user.id)
        with conn.cursor() as cur:
            cur.execute(
                """
                select l.* from vw_lancamentos_analitico l
                join conciliacoes c on c.id = %s
                where l.lancamento_id in (
                    select id from lancamentos where conciliacao_id = %s
                )
                and l.cnpj_id = any(%s::uuid[])
                order by l.data_lancamento;
                """,
                (conciliacao_id, conciliacao_id, cnpj_ids),
            )
            rows = cur.fetchall()
            if not rows:
                # confirma se a conciliacao existe mas o usuario nao tem acesso, vs nao existe
                with conn.cursor() as cur2:
                    cur2.execute(
                        "select cnpj_id from conciliacoes where id = %s;", (conciliacao_id,)
                    )
                    conc = cur2.fetchone()
                    if conc and str(conc["cnpj_id"]) not in cnpj_ids:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Sem acesso a esta conciliacao",
                        )
            return rows
