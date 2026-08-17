import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../auth/supabaseClient";
import { translateAuthError } from "../auth/authErrors";

type Status = "verificando" | "pronto" | "invalido" | "salvando" | "concluido";

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("verificando");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // O link de recuperação carrega o token na URL e o supabase-js estabelece
    // a sessão automaticamente — só confirmamos que ela existe antes de
    // liberar o formulário de nova senha.
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
      setError(translateAuthError(updateError.message));
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
          <p style={{ color: "var(--color-text-muted)" }}>Verificando o link de redefinição...</p>
        )}

        {status === "invalido" && (
          <>
            <h1 style={{ fontSize: "1.3rem" }}>Link inválido ou expirado</h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              Esse link de redefinição de senha já foi usado ou não é mais válido. Solicite um novo
              em "Esqueci minha senha" na tela de login.
            </p>
          </>
        )}

        {status === "concluido" && (
          <>
            <h1 style={{ fontSize: "1.3rem" }}>Senha atualizada!</h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              Sua senha foi redefinida com sucesso. Redirecionando para o portal...
            </p>
          </>
        )}

        {(status === "pronto" || status === "salvando") && (
          <form onSubmit={handleSubmit}>
            <h1 style={{ fontSize: "1.3rem" }}>Redefinir senha</h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "1.4rem" }}>
              Defina uma nova senha para acessar o PortalContabil.cloud.
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
                Confirmar nova senha
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
              {status === "salvando" ? "Salvando..." : "Redefinir senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
