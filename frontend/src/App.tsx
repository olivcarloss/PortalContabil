import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import RequireAuth from "./components/RequireAuth";
import Shell from "./components/Shell";
import Login from "./pages/Login";
import LicensingHome from "./pages/licensing/LicensingHome";
import AccountingHome from "./pages/accounting/AccountingHome";
import VisaoGeral from "./pages/admin/VisaoGeral";
import Conciliacao from "./pages/admin/Conciliacao";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
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
          <Route path="/licenciamento" element={<LicensingHome />} />
          <Route path="/contabil" element={<AccountingHome />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
