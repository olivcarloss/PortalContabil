from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core import mailer
from app.core.db import get_conn
from app.core.report_files import build_csv, build_pdf, build_xlsx
from app.core.security import CurrentUser, get_current_user
from app.modules.accounting.access import get_modulos_liberados, require_cnpjs_liberados
from app.modules.licensing.menus import (
    MENU_PORTAL_CONTABIL,
    MENU_RELATORIO_ANALITICO,
    MENU_RELATORIO_CLIENTES,
    MENU_RELATORIO_ESCRITORIOS,
    MENU_RELATORIO_MODULOS,
    MENU_RELATORIO_PLANO_CONTAS,
    MENU_RELATORIO_PRODUTOS,
    MENU_RELATORIO_SINTETICO,
    MENU_RELATORIO_TABELA_PRECOS,
    require_menu,
)
from app.modules.licensing.renovacao import renovar_licencas_vencidas
from app.schemas.accounting import (
    ConciliacaoSintetico,
    EnviarRelatorioEmail,
    LancamentoAnalitico,
    MeuProdutoLicenciado,
)

router = APIRouter(prefix="/accounting", tags=["accounting"])

_QUALQUER_RELATORIO = (
    MENU_RELATORIO_SINTETICO,
    MENU_RELATORIO_ANALITICO,
    MENU_RELATORIO_ESCRITORIOS,
    MENU_RELATORIO_CLIENTES,
    MENU_RELATORIO_PRODUTOS,
    MENU_RELATORIO_MODULOS,
    MENU_RELATORIO_TABELA_PRECOS,
    MENU_RELATORIO_PLANO_CONTAS,
)

_MIME_BY_FORMATO = {
    "csv": "text/csv",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "pdf": "application/pdf",
}
_EXT_BY_FORMATO = {"csv": "csv", "xlsx": "xlsx", "pdf": "pdf"}


@router.get("/meus-modulos", response_model=list[str])
def meus_modulos(
    user: CurrentUser = Depends(require_menu(MENU_PORTAL_CONTABIL, MENU_RELATORIO_MODULOS)),
):
    with get_conn() as conn:
        return get_modulos_liberados(conn, user.id)


@router.get("/meus-produtos", response_model=list[MeuProdutoLicenciado])
def meus_produtos(user: CurrentUser = Depends(require_menu(MENU_PORTAL_CONTABIL))):
    """Todos os produtos licenciados para o escritorio (cliente) do usuario
    logado, com o(s) CNPJ(s) a que cada licenca se aplica — um CNPJ
    diretamente (produto 'por_cnpj') ou todos os CNPJs ativos do escritorio
    (produto 'por_cliente'). Baseado no escritorio do usuario, e nao apenas
    nas licencas explicitamente vinculadas a ele via usuario_licencas —
    senao produtos ativados por um admin, mas ainda nao concedidos a este
    usuario especificamente, ficariam fora da visao geral do portal."""
    with get_conn() as conn:
        renovar_licencas_vencidas(conn)
        with conn.cursor() as cur:
            cur.execute(
                """
                select
                    l.id as licenca_id,
                    p.id as produto_id, p.nome as produto_nome, p.codigo as produto_codigo,
                    p.categoria,
                    l.status, l.periodicidade, l.data_inicio, l.data_fim, l.valor_total,
                    c.id as cnpj_id, c.cnpj, c.razao_social, c.nome_fantasia
                from usuarios_portal up
                join licencas l on l.cliente_id = up.cliente_id
                join produtos p on p.id = l.produto_id
                left join cnpjs c on (
                    (p.escopo_licenca = 'por_cnpj' and c.id = l.cnpj_id)
                    or (p.escopo_licenca = 'por_cliente' and c.cliente_id = l.cliente_id and c.ativo)
                )
                where up.id = %s
                order by p.nome, c.razao_social;
                """,
                (user.id,),
            )
            return cur.fetchall()


@router.get("/conciliacoes", response_model=list[ConciliacaoSintetico])
def list_conciliacoes(
    user: CurrentUser = Depends(require_menu(MENU_PORTAL_CONTABIL, MENU_RELATORIO_SINTETICO)),
):
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
    conciliacao_id: UUID,
    user: CurrentUser = Depends(require_menu(MENU_PORTAL_CONTABIL, MENU_RELATORIO_ANALITICO)),
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


@router.post("/relatorios/enviar-email", status_code=status.HTTP_200_OK)
def enviar_relatorio_email(
    payload: EnviarRelatorioEmail,
    _: CurrentUser = Depends(require_menu(*_QUALQUER_RELATORIO)),
):
    """Gera o relatorio (mesmos dados ja exibidos/exportados na tela) no
    formato pedido e envia por e-mail em anexo, com um HTML padronizado
    explicando o que o destinatario esta recebendo."""
    if payload.formato == "csv":
        anexo = build_csv(payload.colunas, payload.linhas)
    elif payload.formato == "xlsx":
        anexo = build_xlsx(payload.colunas, payload.linhas)
    else:
        anexo = build_pdf(payload.titulo, payload.colunas, payload.linhas, mailer.LOGO_URL)

    try:
        mailer.send_email_with_attachment(
            destinatarios=[str(d) for d in payload.destinatarios],
            assunto=f"Relatório: {payload.titulo}",
            html_body=mailer.build_relatorio_email_html(payload.titulo),
            anexo_bytes=anexo,
            anexo_nome=f"{payload.titulo.lower().replace(' ', '-')}.{_EXT_BY_FORMATO[payload.formato]}",
            anexo_mimetype=_MIME_BY_FORMATO[payload.formato],
        )
    except mailer.MailerError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc

    return {"enviado": True}
