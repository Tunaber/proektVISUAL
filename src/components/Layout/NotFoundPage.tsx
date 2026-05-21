import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <h1 style={{ fontSize: 64, color: '#ccc', margin: '0 0 16px' }}>404</h1>
      <p style={{ fontSize: 18, color: '#666', marginBottom: 24 }}>Page not found</p>
      <Link to="/dashboard" style={{ color: '#1a73e8', textDecoration: 'none', fontSize: 14 }}>Go to Dashboard</Link>
    </div>
  );
}
