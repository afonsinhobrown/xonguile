import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/Login'));
const RegisterPage = lazy(() => import('./pages/Register'));
const Clients = lazy(() => import('./pages/Clients'));
const Agenda = lazy(() => import('./pages/Agenda'));
const Professionals = lazy(() => import('./pages/Professionals'));
const Services = lazy(() => import('./pages/Services'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Stock = lazy(() => import('./pages/Stock'));
const Settings = lazy(() => import('./pages/Settings'));
const Finance = lazy(() => import('./pages/Finance'));
const POS = lazy(() => import('./pages/POS'));
const LandingPage = lazy(() => import('./pages/Landing'));
const SuperAdmin = lazy(() => import('./pages/SuperAdmin'));
const Explore = lazy(() => import('./pages/Explore'));
const BookingPublic = lazy(() => import('./pages/BookingPublic'));
const WaitingList = lazy(() => import('./pages/WaitingList'));
const Support = lazy(() => import('./pages/Support'));

function PrivateRoute({ children }: { children: JSX.Element }) {
  const user = localStorage.getItem('salao_user');
  return user ? children : <Navigate to="/login" replace />;
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/explorar" element={<Explore />} />
            <Route path="/agendar/:salonId" element={<BookingPublic />} />

            <Route path="/admin" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="super" element={<SuperAdmin />} />
              <Route path="caixa" element={<POS />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="clientes" element={<Clients />} />
              <Route path="profissionais" element={<Professionals />} />
              <Route path="servicos" element={<Services />} />
              <Route path="estoque" element={<Stock />} />
              <Route path="financeiro" element={<Finance />} />
              <Route path="fila" element={<WaitingList />} />
              <Route path="suporte" element={<Support />} />
              <Route path="configuracoes" element={<Settings />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
