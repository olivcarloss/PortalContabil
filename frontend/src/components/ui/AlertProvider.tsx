import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import Modal from "./Modal";

type AlertState = { title: string; message: string } | null;

const AlertContext = createContext<((message: string, title?: string) => void) | null>(null);

/**
 * Popup padrão pra mensagens de erro/aviso disparadas por uma ação do
 * usuário (salvar, excluir, etc.) — em vez de texto solto na tela, mostra
 * um modal com botão "Continuar", igual ao padrão dos outros diálogos do
 * portal. Uso: const showAlert = useAlert(); showAlert("mensagem").
 */
export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertState>(null);

  const showAlert = useCallback((message: string, title = "Aviso") => {
    setAlert({ title, message });
  }, []);

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      {alert && (
        <Modal
          title={alert.title}
          onClose={() => setAlert(null)}
          footer={
            <button className="btn btn-primary" onClick={() => setAlert(null)}>
              Continuar
            </button>
          }
        >
          <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: "pre-line" }}>{alert.message}</p>
        </Modal>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const showAlert = useContext(AlertContext);
  if (!showAlert) throw new Error("useAlert deve ser usado dentro de AlertProvider");
  return showAlert;
}
