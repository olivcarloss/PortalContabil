import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../auth/supabaseClient";

type Status = "verificando" | "pronto" | "invalido" | "salvando" | "concluido";

export default function AceitarConvite() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("verificando");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // O supabase-js processa o token do link de convite (na URL) e cria a
    // sessão automaticamente ao carregar a página — só precisamos confirmar
    // que ela existe antes de liberar o formulário de senha.
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "pronto" : "invalido");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setStatus((s) => (s === "verificando" ? "pronto" : s));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmarPassword) {
      setError("As senhas não conferem.");
      return;
    }
    setStatus("salvando");
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setStatus("pronto");
      return;
    }
    setStatus("concluido");
    setTimeout(() => navigate("/"), 1500);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-surface-alt)",
      }}
    >
      <div className="card" style={{ width: 400 }}>
        <img
          src="/portal-contabil-logo.svg"
          alt="PortalContabil.cloud"
          style={{ height: 44, width: "auto", display: "block", marginBottom: "1.5rem" }}
        />

        {status === "verificando" && (
          <p style={{ color: "var(--color-text-muted)" }}>Verificando seu convite...</p>
        )}

        {status === "invalido" && (
          <>
            <h1 style={{ fontSize: "1.3rem" }}>Convite inválido ou expirado</h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              Esse link já foi usado ou não é mais válido. Peça ao administrador do seu escritório
              para enviar um novo convite.
            </p>
          </>
        )}

        {status === "concluido" && (
          <>
            <h1 style={{ fontSize: "1.3rem" }}>Conta ativada!</h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              Sua senha foi definida com sucesso. Redirecionando para o portal...
            </p>
          </>
        )}

        {(status === "pronto" || status === "salvando") && (
          <form onSubmit={handleSubmit}>
            <h1 style={{ fontSize: "1.3rem" }}>Ative sua conta</h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "1.4rem" }}>
              Defina uma senha para acessar o PortalContabil.cloud.
            </p>

            <label style={{ display: "block", marginBottom: "0.9rem" }}>
              <span style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                Nova senha
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                autoFocus
              />
            </label>

            <label style={{ display: "block", marginBottom: "1.2rem" }}>
              <span style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                Confirmar senha
              </span>
              <input
                type="password"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>

            {error && <p style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</p>}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={status === "salvando"}
            >
              {status === "salvando" ? "Ativando..." : "Ativar conta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
