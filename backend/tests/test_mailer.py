import pytest

from app.core import mailer


def test_build_relatorio_email_html_includes_titulo():
    html = mailer.build_relatorio_email_html("Relatório Sintético")
    assert "Relatório Sintético" in html
    assert "<html" not in html  # e um fragmento, embutido pelo cliente de e-mail


def test_send_email_without_smtp_configured_raises(monkeypatch):
    monkeypatch.setattr(mailer.settings, "smtp_host", "")
    with pytest.raises(mailer.MailerError, match="nao configurado"):
        mailer.send_email_with_attachment(
            destinatarios=["a@example.com"],
            assunto="Assunto",
            html_body="<p>oi</p>",
            anexo_bytes=b"conteudo",
            anexo_nome="arquivo.csv",
            anexo_mimetype="text/csv",
        )
