import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ClientsPage from './pages/Clients';
import AgendaPage from './pages/Agenda';
import ProfessionalsPage from './pages/Professionals';
import ServicesPage from './pages/Services';
import DashboardPage from './pages/Dashboard';
import StockPage from './pages/Stock';
import SettingsPage from './pages/Settings';
import FinancePage from './pages/Finance';
import POSPage from './pages/POS';

import LandingPage from './pages/Landing';
import SuperAdminPage from './pages/SuperAdmin';
import ExplorePage from './pages/Explore';
import BookingPublicPage from './pages/BookingPublic';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const user = localStorage.getItem('salao_user');
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/explorar" element={<ExplorePage />} />
        <Route path="/agendar/:salonId" element={<BookingPublicPage />} />

        <Route path="/admin" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="super" element={<SuperAdminPage />} />
          <Route path="caixa" element={<POSPage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="profissionais" element={<ProfessionalsPage />} />
          <Route path="servicos" element={<ServicesPage />} />
          <Route path="estoque" element={<StockPage />} />
          <Route path="financeiro" element={<FinancePage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
