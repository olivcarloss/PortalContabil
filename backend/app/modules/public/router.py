"""Endpoints publicos, sem autenticacao — usados pela home de marketing
(fora do portal logado). Hoje so o formulario de contato."""

from html import escape

from fastapi import APIRouter, HTTPException, status

from app.core import mailer
from app.schemas.public import ContatoForm

router = APIRouter(prefix="/public", tags=["public"])

CONTATO_DESTINO = "contato@portalcontabil.cloud"


def _build_contato_email_html(payload: ContatoForm) -> str:
    linhas = [
        f'<p style="margin:0 0 8px;"><strong>Nome:</strong> {escape(payload.nome)}</p>',
        f'<p style="margin:0 0 8px;"><strong>E-mail:</strong> {escape(payload.email)}</p>',
    ]
    if payload.escritorio:
        linhas.append(f'<p style="margin:0 0 8px;"><strong>Escritório:</strong> {escape(payload.escritorio)}</p>')
    if payload.assunto:
        linhas.append(f'<p style="margin:0 0 8px;"><strong>Assunto:</strong> {escape(payload.assunto)}</p>')
    mensagem_html = escape(payload.mensagem).replace("\n", "<br>")
    linhas.append(
        f'<p style="margin:16px 0 0;"><strong>Mensagem:</strong></p>'
        f'<p style="margin:4px 0 0; white-space:pre-line;">{mensagem_html}</p>'
    )
    corpo = "\n".join(linhas)
    return f"""
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #14213a;">
      <div style="border-bottom: 2px solid #14213a; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="font-size: 18px; margin: 0;">Nova mensagem pelo site — PortalContabil.cloud</h2>
      </div>
      <div style="font-size: 14px; line-height: 1.6; color: #333;">
        {corpo}
      </div>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9aa6b6;">
        Enviado pelo formulário de contato em portalcontabil.cloud.
      </div>
    </div>
    """


@router.post("/contato", status_code=status.HTTP_200_OK)
def enviar_contato(payload: ContatoForm):
    try:
        mailer.send_plain_email(
            destinatarios=[CONTATO_DESTINO],
            assunto=f"Contato pelo site — {payload.nome}",
            html_body=_build_contato_email_html(payload),
            reply_to=payload.email,
        )
    except mailer.MailerError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    return {"enviado": True}
