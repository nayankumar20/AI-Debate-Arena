import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ArenaPulsePage } from '@/pages/ArenaPulsePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DebateCreatePage } from '@/pages/DebateCreatePage';
import { DebateLivePage } from '@/pages/DebateLivePage';
import { DebateResultsPage } from '@/pages/DebateResultsPage';
import { DebateHistoryPage } from '@/pages/DebateHistoryPage';
import { ProfilePage } from '@/pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/arena-pulse"
                element={
                  <ProtectedRoute>
                    <ArenaPulsePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/debates/history"
                element={
                  <ProtectedRoute>
                    <DebateHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/debate/create"
                element={
                  <ProtectedRoute>
                    <DebateCreatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/debate/:id/results"
                element={
                  <ProtectedRoute>
                    <DebateResultsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/debate/:id"
                element={
                  <ProtectedRoute>
                    <DebateLivePage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
