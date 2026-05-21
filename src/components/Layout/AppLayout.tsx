import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch, logout } from '../../store';

export function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const isSpreadsheetPage = location.pathname.startsWith('/documents/');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ height: 48, background: '#1a73e8', color: '#fff', display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/dashboard" style={{ color: '#fff', textDecoration: 'none', fontSize: 18, fontWeight: 700 }}>Sheets</Link>
          {isSpreadsheetPage && (
            <span style={{ fontSize: 13, opacity: 0.8 }}>
              <Link to="/dashboard" style={{ color: '#fff', opacity: 0.7 }}>My Documents</Link>
              <span style={{ margin: '0 8px' }}>→</span>
              <span>{location.pathname.split('/').pop()}</span>
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAuthenticated ? (
            <>
              <Link to="/profile" style={{ color: '#fff', textDecoration: 'none', fontSize: 13, opacity: 0.9 }}>{user?.name || user?.email}</Link>
              <button onClick={() => { dispatch(logout()); navigate('/login') }}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Sign Out</button>
            </>
          ) : (
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none', fontSize: 13 }}>Sign In</Link>
          )}
        </div>
      </header>
      <main style={{ flex: 1, overflow: 'hidden' }}><Outlet /></main>
    </div>
  );
}
