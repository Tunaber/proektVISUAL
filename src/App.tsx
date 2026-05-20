import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { ProtectedRoute } from './components/Layout/ProtectedRoute';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SpreadsheetPage } from './components/Spreadsheet/SpreadsheetPage';
import { ProfilePage } from './components/Profile/ProfilePage';
import { LoginPage } from './components/Auth/LoginPage';
import { RegisterPage } from './components/Auth/RegisterPage';
import { NotFoundPage } from './components/Layout/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents/:documentId"
            element={
              <ProtectedRoute>
                <SpreadsheetPage />
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
