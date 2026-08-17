import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function RequireMenu({
  menu,
  children,
}: {
  menu: string;
  children: ReactNode;
}) {
  const { profileLoading, hasMenu } = useAuth();

  if (profileLoading) return <p style={{ padding: "2rem" }}>Carregando...</p>;
  if (!hasMenu(menu)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
