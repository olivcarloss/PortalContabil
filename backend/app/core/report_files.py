"""Gera o arquivo (CSV, XLSX ou PDF) de um relatorio generico — colunas +
linhas de texto ja formatadas pelo frontend (mesmos dados que os botoes de
exportar no navegador usam), para anexar no e-mail."""

import csv
import io

from openpyxl import Workbook
from xhtml2pdf import pisa


def build_csv(colunas: list[str], linhas: list[list[str]]) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf, delimiter=";")
    writer.writerow(colunas)
    writer.writerows(linhas)
    return ("﻿" + buf.getvalue()).encode("utf-8")


def build_xlsx(colunas: list[str], linhas: list[list[str]]) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.append(colunas)
    for linha in linhas:
        ws.append(linha)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def build_pdf(titulo: str, colunas: list[str], linhas: list[list[str]], logo_url: str) -> bytes:
    header_cells = "".join(f"<th>{_escape(c)}</th>" for c in colunas)
    body_rows = "".join(
        "<tr>" + "".join(f"<td>{_escape(v)}</td>" for v in linha) + "</tr>" for linha in linhas
    )
    html = f"""
    <html>
      <head>
        <style>
          body {{ font-family: Helvetica, Arial, sans-serif; }}
          .cabecalho {{ border-bottom: 2px solid #14213a; padding-bottom: 10px; margin-bottom: 14px; }}
          .cabecalho img {{ height: 28px; }}
          h1 {{ font-size: 16px; margin: 8px 0 0; }}
          table {{ width: 100%; border-collapse: collapse; font-size: 10px; }}
          th, td {{ border: 1px solid #ccc; padding: 4px 6px; text-align: left; }}
          th {{ background: #f2f2f2; }}
        </style>
      </head>
      <body>
        <div class="cabecalho">
          <img src="{logo_url}" />
          <h1>{_escape(titulo)}</h1>
        </div>
        <table>
          <thead><tr>{header_cells}</tr></thead>
          <tbody>{body_rows}</tbody>
        </table>
      </body>
    </html>
    """
    buf = io.BytesIO()
    result = pisa.CreatePDF(io.StringIO(html), dest=buf)
    if result.err:
        raise ValueError("Falha ao gerar PDF do relatorio")
    return buf.getvalue()


def _escape(value: str) -> str:
    return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
