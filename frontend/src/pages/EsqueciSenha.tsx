import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../auth/supabaseClient";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEnviado(true);
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
      <div className="card" style={{ width: 380 }}>
        <img
          src="/portal-contabil-logo.svg"
          alt="PortalContabil.cloud"
          style={{ height: 44, width: "auto", display: "block", marginBottom: "1.5rem" }}
        />

        {enviado ? (
          <>
            <h1 style={{ fontSize: "1.3rem" }}>Verifique seu e-mail</h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "1.4rem" }}>
              Se houver uma conta cadastrada com o e-mail <b>{email}</b>, enviamos um link para
              redefinir a senha. Confira também a caixa de spam.
            </p>
            <Link to="/login" className="btn btn-secondary" style={{ width: "100%", textAlign: "center" }}>
              Voltar para o login
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1 style={{ fontSize: "1.3rem" }}>Esqueci minha senha</h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "1.4rem" }}>
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>

            <label style={{ display: "block", marginBottom: "1.2rem" }}>
              <span style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                E-mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </label>

            {error && <p style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</p>}

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de redefinição"}
            </button>

            <Link
              to="/login"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: "1rem",
                fontSize: "0.85rem",
                color: "var(--color-text-muted)",
              }}
            >
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
