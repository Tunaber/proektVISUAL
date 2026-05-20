import { useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setMockUser } from '../../store/slices/authSlice';

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const documents = useAppSelector((s) => s.documents.documents);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const handleNameSave = useCallback(() => {
    if (user && nameValue.trim()) {
      dispatch(setMockUser({ ...user, name: nameValue.trim() }));
      setEditingName(false);
    }
  }, [dispatch, user, nameValue]);

  const handlePasswordChange = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordMessage('');

      if (!currentPassword) { setPasswordMessage('Current password is required'); return; }
      if (!newPassword || newPassword.length < 8) { setPasswordMessage('New password must be at least 8 characters'); return; }
      if (newPassword !== confirmNewPassword) { setPasswordMessage('Passwords do not match'); return; }

      setTimeout(() => {
        setPasswordMessage('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }, 500);
    },
    [currentPassword, newPassword, confirmNewPassword],
  );

  if (!user) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Please log in to view your profile.</div>;
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Profile</h1>

      <Section title="Personal Information">
        <div style={{ marginBottom: 12 }}>
          <Label>Email</Label>
          <div style={{ fontSize: 14, color: '#333' }}>{user.email}</div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <Label>Name</Label>
          {editingName ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') setEditingName(false);
                }}
                style={inputStyle}
                autoFocus
              />
              <button onClick={handleNameSave} style={btnStyle}>Save</button>
              <button onClick={() => setEditingName(false)} style={{ ...btnStyle, background: '#fff', color: '#333', border: '1px solid #ccc' }}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#333' }}>{user.name}</span>
              <button onClick={() => { setNameValue(user.name); setEditingName(true); }} style={btnStyle}>Edit</button>
            </div>
          )}
        </div>
      </Section>

      <Section title="Statistics">
        <div style={{ marginBottom: 8 }}>
          <Label>Documents</Label>
          <div style={{ fontSize: 14, color: '#333' }}>{documents.length}</div>
        </div>
        <div>
          <Label>Registered</Label>
          <div style={{ fontSize: 14, color: '#333' }}>{new Date(user.createdAt).toLocaleDateString()}</div>
        </div>
      </Section>

      <Section title="Change Password">
        {!showPasswordForm ? (
          <button onClick={() => setShowPasswordForm(true)} style={btnStyle}>
            Change Password
          </button>
        ) : (
          <form onSubmit={handlePasswordChange}>
            <div style={{ marginBottom: 12 }}>
              <Label>Current Password</Label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Label>New Password</Label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Label>Confirm New Password</Label>
              <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} style={inputStyle} />
            </div>
            {passwordMessage && (
              <div style={{ color: passwordMessage.includes('successfully') ? '#2e7d32' : '#d32f2f', fontSize: 13, marginBottom: 12 }}>
                {passwordMessage}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={btnStyle}>Update Password</button>
              <button onClick={() => setShowPasswordForm(false)} style={{ ...btnStyle, background: '#fff', color: '#333', border: '1px solid #ccc' }}>Cancel</button>
            </div>
          </form>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24, padding: 20, border: '1px solid #e0e0e0', borderRadius: 8, background: '#fff' }}>
      <h2 style={{ fontSize: 16, margin: '0 0 16px', paddingBottom: 8, borderBottom: '1px solid #eee' }}>{title}</h2>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>{children}</div>;
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  padding: '6px 16px',
  background: '#1a73e8',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
};
