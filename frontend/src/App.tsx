import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import RequireAuth from "./components/RequireAuth";
import Shell from "./components/Shell";
import Login from "./pages/Login";
import AceitarConvite from "./pages/AceitarConvite";
import RodriSaasLanding from "./pages/marketing/RodriSaasLanding";
import OverviewTab from "./pages/licensing/OverviewTab";
import ProdutosTab from "./pages/licensing/ProdutosTab";
import ClientesTab from "./pages/licensing/ClientesTab";
import UsuariosTab from "./pages/licensing/UsuariosTab";
import PerfisTab from "./pages/licensing/PerfisTab";
import AccountingHome from "./pages/accounting/AccountingHome";
import VisaoGeral from "./pages/admin/VisaoGeral";
import Conciliacao from "./pages/admin/Conciliacao";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/aceitar-convite" element={<AceitarConvite />} />
        <Route path="/rodrisaas" element={<RodriSaasLanding />} />
        <Route
          element={
            <RequireAuth>
              <Shell />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Navigate to="/contabil" replace />} />
          <Route path="/visao-geral" element={<VisaoGeral />} />
          <Route path="/conciliacao" element={<Conciliacao />} />
          <Route path="/licenciamento" element={<OverviewTab />} />
          <Route path="/licenciamento/produtos" element={<ProdutosTab />} />
          <Route path="/licenciamento/clientes" element={<ClientesTab />} />
          <Route path="/licenciamento/usuarios" element={<UsuariosTab />} />
          <Route path="/licenciamento/perfis" element={<PerfisTab />} />
          <Route path="/contabil" element={<AccountingHome />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
