import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated);
  if (!isAuth) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
