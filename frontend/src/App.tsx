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
import PortalContabilLanding from "./pages/marketing/PortalContabilLanding";
import OverviewTab from "./pages/licensing/OverviewTab";
import ProdutosTab from "./pages/licensing/ProdutosTab";
import ClientesTab from "./pages/licensing/ClientesTab";
import UsuariosTab from "./pages/licensing/UsuariosTab";
import PerfisTab from "./pages/licensing/PerfisTab";
import PlanoContasTab from "./pages/licensing/PlanoContasTab";
import AccountingHome from "./pages/accounting/AccountingHome";
import VisaoGeral from "./pages/admin/VisaoGeral";
import Conciliacao from "./pages/admin/Conciliacao";
import RelatorioSintetico from "./pages/accounting/relatorios/Sintetico";
import RelatorioAnalitico from "./pages/accounting/relatorios/Analitico";
import RelatorioEscritorios from "./pages/accounting/relatorios/Escritorios";
import RelatorioClientes from "./pages/accounting/relatorios/Clientes";
import RelatorioProdutos from "./pages/accounting/relatorios/Produtos";
import RelatorioModulos from "./pages/accounting/relatorios/Modulos";
import RelatorioTabelaPrecos from "./pages/accounting/relatorios/TabelaPrecos";
import RelatorioPlanoContas from "./pages/accounting/relatorios/PlanoContas";
import {
  MENU_ADMIN_CONCILIACAO,
  MENU_ADMIN_VISAO_GERAL,
  MENU_LICENCIAMENTO_ESCRITORIOS,
  MENU_LICENCIAMENTO_PERFIS,
  MENU_LICENCIAMENTO_PLANO_CONTAS,
  MENU_LICENCIAMENTO_PRODUTOS,
  MENU_LICENCIAMENTO_USUARIOS,
  MENU_LICENCIAMENTO_VISAO_GERAL,
  MENU_PORTAL_CONTABIL,
  MENU_RELATORIO_ANALITICO,
  MENU_RELATORIO_CLIENTES,
  MENU_RELATORIO_ESCRITORIOS,
  MENU_RELATORIO_MODULOS,
  MENU_RELATORIO_PLANO_CONTAS,
  MENU_RELATORIO_PRODUTOS,
  MENU_RELATORIO_SINTETICO,
  MENU_RELATORIO_TABELA_PRECOS,
} from "./auth/menus";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/aceitar-convite" element={<AceitarConvite />} />
        <Route path="/esqueci-minha-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/inicio" element={<PortalContabilLanding />} />
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
            path="/licenciamento/plano-contas"
            element={
              <RequireMenu menu={MENU_LICENCIAMENTO_PLANO_CONTAS}>
                <PlanoContasTab />
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
          <Route
            path="/contabil/relatorios/sintetico"
            element={
              <RequireMenu menu={MENU_RELATORIO_SINTETICO}>
                <RelatorioSintetico />
              </RequireMenu>
            }
          />
          <Route
            path="/contabil/relatorios/analitico"
            element={
              <RequireMenu menu={MENU_RELATORIO_ANALITICO}>
                <RelatorioAnalitico />
              </RequireMenu>
            }
          />
          <Route
            path="/contabil/relatorios/escritorios"
            element={
              <RequireMenu menu={MENU_RELATORIO_ESCRITORIOS}>
                <RelatorioEscritorios />
              </RequireMenu>
            }
          />
          <Route
            path="/contabil/relatorios/clientes"
            element={
              <RequireMenu menu={MENU_RELATORIO_CLIENTES}>
                <RelatorioClientes />
              </RequireMenu>
            }
          />
          <Route
            path="/contabil/relatorios/produtos"
            element={
              <RequireMenu menu={MENU_RELATORIO_PRODUTOS}>
                <RelatorioProdutos />
              </RequireMenu>
            }
          />
          <Route
            path="/contabil/relatorios/modulos"
            element={
              <RequireMenu menu={MENU_RELATORIO_MODULOS}>
                <RelatorioModulos />
              </RequireMenu>
            }
          />
          <Route
            path="/contabil/relatorios/tabela-precos"
            element={
              <RequireMenu menu={MENU_RELATORIO_TABELA_PRECOS}>
                <RelatorioTabelaPrecos />
              </RequireMenu>
            }
          />
          <Route
            path="/contabil/relatorios/plano-contas"
            element={
              <RequireMenu menu={MENU_RELATORIO_PLANO_CONTAS}>
                <RelatorioPlanoContas />
              </RequireMenu>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
