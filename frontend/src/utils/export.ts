export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

function toRows<T>(columns: ExportColumn<T>[], rows: T[]): string[][] {
  return rows.map((r) => columns.map((c) => String(c.value(r) ?? "")));
}

export function toExportData<T>(
  columns: ExportColumn<T>[],
  rows: T[]
): { colunas: string[]; linhas: string[][] } {
  return { colunas: columns.map((c) => c.header), linhas: toRows(columns, rows) };
}

function downloadBlob(filename: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string): string {
  if (/[;"\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function exportCsv<T>(filename: string, columns: ExportColumn<T>[], rows: T[]) {
  const lines = [columns.map((c) => c.header), ...toRows(columns, rows)];
  const csv = lines.map((line) => line.map(escapeCsv).join(";")).join("\r\n");
  downloadBlob(`${filename}.csv`, "﻿" + csv, "text/csv;charset=utf-8;");
}

export function exportXls<T>(filename: string, columns: ExportColumn<T>[], rows: T[]) {
  const headerRow = `<tr>${columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join("")}</tr>`;
  const bodyRows = toRows(columns, rows)
    .map((r) => `<tr>${r.map((v) => `<td>${escapeHtml(v)}</td>`).join("")}</tr>`)
    .join("");
  const html = `<html><head><meta charset="UTF-8"></head><body><table>${headerRow}${bodyRows}</table></body></html>`;
  downloadBlob(`${filename}.xls`, html, "application/vnd.ms-excel;charset=utf-8;");
}

const LOGO_URL = `${window.location.origin}/portal-contabil-logo.svg`;

export function exportPdf<T>(title: string, columns: ExportColumn<T>[], rows: T[]) {
  const win = window.open("", "_blank");
  if (!win) return;
  const headerRow = `<tr>${columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join("")}</tr>`;
  const bodyRows = toRows(columns, rows)
    .map((r) => `<tr>${r.map((v) => `<td>${escapeHtml(v)}</td>`).join("")}</tr>`)
    .join("");
  win.document.write(
    `<html><head><title>${escapeHtml(title)}</title><style>` +
      "body{font-family:Arial,Helvetica,sans-serif;padding:24px;}" +
      ".cabecalho{display:flex;align-items:center;gap:12px;margin-bottom:16px;border-bottom:2px solid #14213a;padding-bottom:12px;}" +
      ".cabecalho img{height:36px;width:auto;}" +
      "h1{font-size:18px;margin:0;}" +
      "table{width:100%;border-collapse:collapse;font-size:12px;}" +
      "th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;}" +
      "th{background:#f2f2f2;}" +
      "tfoot td{font-weight:600;background:#f7f7f7;}" +
      `</style></head><body>` +
      `<div class="cabecalho"><img src="${LOGO_URL}" alt="PortalContabil.cloud" /><h1>${escapeHtml(title)}</h1></div>` +
      `<table>${headerRow}${bodyRows}</table>` +
      "<script>window.onload=function(){window.print();};</script></body></html>"
  );
  win.document.close();
}
