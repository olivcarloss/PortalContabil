import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <p style={{ padding: "2rem" }}>Carregando...</p>;
  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
