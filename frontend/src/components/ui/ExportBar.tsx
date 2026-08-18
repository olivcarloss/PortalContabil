import { useState } from "react";
import { exportCsv, exportPdf, exportXls, toExportData, type ExportColumn } from "../../utils/export";
import { accountingApi } from "../../api/accounting";
import { useAuth } from "../../auth/AuthProvider";
import Modal, { Field } from "./Modal";

export default function ExportBar<T>({
  filename,
  title,
  columns,
  rows,
}: {
  filename: string;
  title: string;
  columns: ExportColumn<T>[];
  rows: T[];
}) {
  const [showEmailModal, setShowEmailModal] = useState(false);

  return (
    <>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.9rem" }}>
        <button
          className="btn btn-secondary"
          onClick={() => exportCsv(filename, columns, rows)}
          disabled={rows.length === 0}
        >
          Exportar CSV
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => exportXls(filename, columns, rows)}
          disabled={rows.length === 0}
        >
          Exportar XLS
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => exportPdf(title, columns, rows)}
          disabled={rows.length === 0}
        >
          Exportar PDF
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowEmailModal(true)}
          disabled={rows.length === 0}
        >
          Enviar por e-mail
        </button>
      </div>

      {showEmailModal && (
        <EnviarEmailModal
          title={title}
          columns={columns}
          rows={rows}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </>
  );
}

function EnviarEmailModal<T>({
  title,
  columns,
  rows,
  onClose,
}: {
  title: string;
  columns: ExportColumn<T>[];
  rows: T[];
  onClose: () => void;
}) {
  const { session } = useAuth();
  const [destinatarios, setDestinatarios] = useState(session?.user.email ?? "");
  const [formato, setFormato] = useState<"csv" | "xlsx" | "pdf">("pdf");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  function parseDestinatarios(): string[] {
    return destinatarios
      .split(/[,;\n]/)
      .map((e) => e.trim())
      .filter(Boolean);
  }

  async function handleSend() {
    const emails = parseDestinatarios();
    if (emails.length === 0) {
      setError("Informe pelo menos um e-mail de destino.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const { colunas, linhas } = toExportData(columns, rows);
      await accountingApi.enviarRelatorioEmail({
        destinatarios: emails,
        titulo: title,
        formato,
        colunas,
        linhas,
      });
      setEnviado(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      title="Enviar relatório por e-mail"
      onClose={onClose}
      footer={
        enviado ? (
          <button className="btn btn-primary" onClick={onClose}>
            Fechar
          </button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSend} disabled={sending}>
              {sending ? "Enviando..." : "Enviar"}
            </button>
          </>
        )
      }
    >
      {enviado ? (
        <p>E-mail enviado com sucesso.</p>
      ) : (
        <>
          <Field
            label="Destinatário(s)"
            hint="Separe vários e-mails por vírgula, ponto e vírgula ou uma linha para cada."
          >
            <textarea
              value={destinatarios}
              onChange={(e) => setDestinatarios(e.target.value)}
              rows={3}
              placeholder="nome@escritorio.com.br"
            />
          </Field>
          <Field label="Formato do anexo">
            <select value={formato} onChange={(e) => setFormato(e.target.value as typeof formato)}>
              <option value="pdf">PDF</option>
              <option value="xlsx">XLS (Excel)</option>
              <option value="csv">CSV</option>
            </select>
          </Field>
          {error && <p style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</p>}
        </>
      )}
    </Modal>
  );
}
