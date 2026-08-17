import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { isSupabaseConfigured } from "../auth/supabaseClient";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate("/");
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
      <form onSubmit={handleSubmit} className="card" style={{ width: 380 }}>
        <img
          src="/ia-cloude-logo.png"
          alt="IA-Cloude"
          style={{ height: 44, width: "auto", display: "block", marginBottom: "1.5rem" }}
        />
        <h1 style={{ fontSize: "1.4rem" }}>Portal do Cliente</h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: 0, marginBottom: "1.5rem" }}>
          Entre com suas credenciais para acessar o portal.
        </p>

        {!isSupabaseConfigured && (
          <p
            style={{
              background: "#fff3e0",
              color: "#a15c00",
              padding: "0.6rem 0.8rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8rem",
              marginBottom: "1rem",
            }}
          >
            Configuração pendente: defina VITE_SUPABASE_ANON_KEY em frontend/.env para habilitar o login.
          </p>
        )}

        <label style={{ display: "block", marginBottom: "0.9rem" }}>
          <span style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
            E-mail
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          <span style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
            Senha
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <Link
          to="/esqueci-minha-senha"
          style={{ display: "block", fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "1.2rem" }}
        >
          Esqueci minha senha
        </Link>

        {error && (
          <p style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</p>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
