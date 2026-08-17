import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  MENU_ADMIN_VISAO_GERAL,
  MENU_LICENCIAMENTO_ESCRITORIOS,
  MENU_LICENCIAMENTO_PERFIS,
  MENU_LICENCIAMENTO_PRODUTOS,
  MENU_LICENCIAMENTO_USUARIOS,
  MENU_LICENCIAMENTO_VISAO_GERAL,
  MENU_PORTAL_CONTABIL,
} from "../auth/menus";

// Ordem de prioridade: manda o usuario para a primeira tela que o perfil
// dele realmente libera, em vez de assumir Portal Contábil para todo mundo.
const HOME_PRIORITY: Array<{ menu: string; to: string }> = [
  { menu: MENU_PORTAL_CONTABIL, to: "/contabil" },
  { menu: MENU_ADMIN_VISAO_GERAL, to: "/visao-geral" },
  { menu: MENU_LICENCIAMENTO_VISAO_GERAL, to: "/licenciamento" },
  { menu: MENU_LICENCIAMENTO_PRODUTOS, to: "/licenciamento/produtos" },
  { menu: MENU_LICENCIAMENTO_ESCRITORIOS, to: "/licenciamento/clientes" },
  { menu: MENU_LICENCIAMENTO_USUARIOS, to: "/licenciamento/usuarios" },
  { menu: MENU_LICENCIAMENTO_PERFIS, to: "/licenciamento/perfis" },
];

export default function Home() {
  const { profileLoading, hasMenu } = useAuth();

  if (profileLoading) return <p style={{ padding: "2rem" }}>Carregando...</p>;

  const primeiraTelaLiberada = HOME_PRIORITY.find((item) => hasMenu(item.menu));
  if (primeiraTelaLiberada) return <Navigate to={primeiraTelaLiberada.to} replace />;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Sem acesso configurado</h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        Seu usuário está autenticado, mas o perfil de acesso vinculado a ele ainda não libera
        nenhuma área do portal. Fale com o administrador do seu escritório.
      </p>
    </div>
  );
}
