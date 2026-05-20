import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { register } from '../../store/slices/authSlice';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setValidationError('');

      if (!name.trim()) { setValidationError('Name is required'); return; }
      if (!email) { setValidationError('Email is required'); return; }
      if (!/\S+@\S+\.\S+/.test(email)) { setValidationError('Invalid email format'); return; }
      if (!password || password.length < 8) { setValidationError('Password must be at least 8 characters'); return; }
      if (password !== confirmPassword) { setValidationError('Passwords do not match'); return; }

      const result = await dispatch(register({ name: name.trim(), email, password }));
      if (register.fulfilled.match(result)) {
        navigate('/dashboard', { replace: true });
      }
    },
    [dispatch, name, email, password, confirmPassword, navigate],
  );

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Sign Up</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#555' }}>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            autoFocus
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#555' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#555' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#555' }}>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />
        </div>
        {(validationError || error) && (
          <div style={{ color: '#d32f2f', fontSize: 13, marginBottom: 12 }}>
            {validationError || error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            background: loading ? '#999' : '#1a73e8',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 14,
          }}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 14,
  boxSizing: 'border-box',
};
