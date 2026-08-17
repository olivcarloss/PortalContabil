import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import RequireAuth from "./components/RequireAuth";
import RequireMenu from "./components/RequireMenu";
import Shell from "./components/Shell";
import Login from "./pages/Login";
import Home from "./pages/Home";
import AceitarConvite from "./pages/AceitarConvite";
import EsqueciSenha from "./pages/EsqueciSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import RodriSaasLanding from "./pages/marketing/RodriSaasLanding";
import OverviewTab from "./pages/licensing/OverviewTab";
import ProdutosTab from "./pages/licensing/ProdutosTab";
import ClientesTab from "./pages/licensing/ClientesTab";
import UsuariosTab from "./pages/licensing/UsuariosTab";
import PerfisTab from "./pages/licensing/PerfisTab";
import AccountingHome from "./pages/accounting/AccountingHome";
import VisaoGeral from "./pages/admin/VisaoGeral";
import Conciliacao from "./pages/admin/Conciliacao";
import {
  MENU_ADMIN_CONCILIACAO,
  MENU_ADMIN_VISAO_GERAL,
  MENU_LICENCIAMENTO_ESCRITORIOS,
  MENU_LICENCIAMENTO_PERFIS,
  MENU_LICENCIAMENTO_PRODUTOS,
  MENU_LICENCIAMENTO_USUARIOS,
  MENU_LICENCIAMENTO_VISAO_GERAL,
  MENU_PORTAL_CONTABIL,
} from "./auth/menus";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/aceitar-convite" element={<AceitarConvite />} />
        <Route path="/esqueci-minha-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/rodrisaas" element={<RodriSaasLanding />} />
        <Route
          element={
            <RequireAuth>
              <Shell />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Home />} />
          <Route
            path="/visao-geral"
            element={
              <RequireMenu menu={MENU_ADMIN_VISAO_GERAL}>
                <VisaoGeral />
              </RequireMenu>
            }
          />
          <Route
            path="/conciliacao"
            element={
              <RequireMenu menu={MENU_ADMIN_CONCILIACAO}>
                <Conciliacao />
              </RequireMenu>
            }
          />
          <Route
            path="/licenciamento"
            element={
              <RequireMenu menu={MENU_LICENCIAMENTO_VISAO_GERAL}>
                <OverviewTab />
              </RequireMenu>
            }
          />
          <Route
            path="/licenciamento/produtos"
            element={
              <RequireMenu menu={MENU_LICENCIAMENTO_PRODUTOS}>
                <ProdutosTab />
              </RequireMenu>
            }
          />
          <Route
            path="/licenciamento/clientes"
            element={
              <RequireMenu menu={MENU_LICENCIAMENTO_ESCRITORIOS}>
                <ClientesTab />
              </RequireMenu>
            }
          />
          <Route
            path="/licenciamento/usuarios"
            element={
              <RequireMenu menu={MENU_LICENCIAMENTO_USUARIOS}>
                <UsuariosTab />
              </RequireMenu>
            }
          />
          <Route
            path="/licenciamento/perfis"
            element={
              <RequireMenu menu={MENU_LICENCIAMENTO_PERFIS}>
                <PerfisTab />
              </RequireMenu>
            }
          />
          <Route
            path="/contabil"
            element={
              <RequireMenu menu={MENU_PORTAL_CONTABIL}>
                <AccountingHome />
              </RequireMenu>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
