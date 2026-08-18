"""Envio de e-mails com anexo (relatorios), separado do Supabase Auth (que so
cobre os e-mails de autenticacao — convite/recuperacao de senha). Usa SMTP
puro, configurado via SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD/SMTP_FROM
no .env."""

import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

LOGO_URL = f"{settings.frontend_origin}/portal-contabil-logo.svg"


class MailerError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def build_relatorio_email_html(titulo: str) -> str:
    """HTML padronizado explicando, de forma simples, o que o destinatario
    esta recebendo — sem jargao tecnico, focado em quem nao acompanha o
    sistema no dia a dia."""
    return f"""
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #14213a;">
      <div style="border-bottom: 2px solid #14213a; padding-bottom: 16px; margin-bottom: 20px;">
        <img src="{LOGO_URL}" alt="PortalContabil.cloud" style="height: 36px;" />
      </div>
      <h2 style="font-size: 18px; margin: 0 0 12px;">Relatório: {titulo}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #333;">
        Você está recebendo o relatório <strong>{titulo}</strong>, gerado no
        PortalContabil.cloud. As informações completas estão no arquivo em
        anexo a este e-mail.
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #6b7280;">
        Se você não esperava receber este e-mail, pode ignorá-lo com
        segurança — nenhuma ação é necessária.
      </p>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9aa6b6;">
        PortalContabil.cloud — este é um e-mail automático, não é
        necessário responder.
      </div>
    </div>
    """


def send_email_with_attachment(
    destinatarios: list[str],
    assunto: str,
    html_body: str,
    anexo_bytes: bytes,
    anexo_nome: str,
    anexo_mimetype: str,
) -> None:
    if not settings.smtp_host:
        raise MailerError(
            "Envio de e-mail nao configurado. Peca ao administrador do sistema para "
            "definir SMTP_HOST/SMTP_USER/SMTP_PASSWORD no servidor."
        )

    msg = MIMEMultipart()
    msg["Subject"] = assunto
    msg["From"] = settings.smtp_from
    msg["To"] = ", ".join(destinatarios)
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    maintype, _, subtype = anexo_mimetype.partition("/")
    part = MIMEApplication(anexo_bytes, _subtype=subtype or "octet-stream")
    part.add_header("Content-Disposition", "attachment", filename=anexo_nome)
    msg.attach(part)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            server.starttls()
            if settings.smtp_user:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from, destinatarios, msg.as_string())
    except (smtplib.SMTPException, OSError) as exc:
        raise MailerError(f"Falha ao enviar e-mail: {exc}") from exc
