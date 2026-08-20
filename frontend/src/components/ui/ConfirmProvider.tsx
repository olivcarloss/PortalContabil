import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import Modal from "./Modal";

type ConfirmOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmState = (ConfirmOptions & { message: string; resolve: (value: boolean) => void }) | null;

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Popup de confirmação padrão do portal — substitui o confirm() nativo do
 * navegador (feio, sem estilo) por um modal no mesmo padrão visual dos
 * outros diálogos. Uso: const confirmAction = useConfirm();
 * if (!(await confirmAction("Excluir X?"))) return;
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>(null);

  const confirmAction = useCallback<ConfirmFn>((message, options) => {
    return new Promise<boolean>((resolve) => {
      setState({ message, resolve, ...options });
    });
  }, []);

  function handle(result: boolean) {
    state?.resolve(result);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirmAction}>
      {children}
      {state && (
        <Modal
          title={state.title ?? "Confirmar ação"}
          onClose={() => handle(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => handle(false)}>
                {state.cancelLabel ?? "Cancelar"}
              </button>
              <button
                className={`btn ${state.danger ? "btn-danger" : "btn-primary"}`}
                onClick={() => handle(true)}
                autoFocus
              >
                {state.confirmLabel ?? "Confirmar"}
              </button>
            </>
          }
        >
          <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: "pre-line" }}>{state.message}</p>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirmAction = useContext(ConfirmContext);
  if (!confirmAction) throw new Error("useConfirm deve ser usado dentro de ConfirmProvider");
  return confirmAction;
}
