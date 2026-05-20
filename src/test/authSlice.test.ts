import { describe, it, expect } from 'vitest';
import authReducer, { logout, setMockUser, clearError, login, register } from '../store/slices/authSlice';
import type { AuthState } from '../types';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

describe('authSlice', () => {
  it('should return initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should set mock user', () => {
    const user = { id: '1', name: 'Test', email: 'test@test.com', createdAt: '2024-01-01' };
    const next = authReducer(initialState, setMockUser(user));
    expect(next.user).toEqual(user);
    expect(next.isAuthenticated).toBe(true);
    expect(next.accessToken).toBe('mock_token');
  });

  it('should logout', () => {
    const loggedIn: AuthState = {
      user: { id: '1', name: 'T', email: 't@t.com', createdAt: '' },
      accessToken: 'token',
      isAuthenticated: true,
      loading: false,
      error: null,
    };
    const next = authReducer(loggedIn, logout());
    expect(next.isAuthenticated).toBe(false);
    expect(next.user).toBeNull();
    expect(next.accessToken).toBeNull();
  });

  it('should clear error', () => {
    const withError: AuthState = { ...initialState, error: 'some error' };
    const next = authReducer(withError, clearError());
    expect(next.error).toBeNull();
  });

  it('should handle login.pending', () => {
    const next = authReducer(initialState, login.pending('', { email: '', password: '' }));
    expect(next.loading).toBe(true);
    expect(next.error).toBeNull();
  });

  it('should handle login.fulfilled', () => {
    const payload = { user: { id: '1', name: 'Test', email: 't@t.com', createdAt: '' }, accessToken: 'tok' };
    const next = authReducer(initialState, login.fulfilled(payload, '', { email: '', password: '' }));
    expect(next.loading).toBe(false);
    expect(next.isAuthenticated).toBe(true);
    expect(next.user?.email).toBe('t@t.com');
  });

  it('should handle login.rejected', () => {
    const next = authReducer(initialState, login.rejected(new Error('bad'), '', { email: '', password: '' }));
    expect(next.loading).toBe(false);
    expect(next.error).toBeTruthy();
  });

  it('should handle register.fulfilled', () => {
    const payload = { user: { id: '2', name: 'New', email: 'new@t.com', createdAt: '' }, accessToken: 'tok2' };
    const next = authReducer(initialState, register.fulfilled(payload, '', { name: 'New', email: 'new@t.com', password: '12345678' }));
    expect(next.loading).toBe(false);
    expect(next.isAuthenticated).toBe(true);
    expect(next.user?.name).toBe('New');
  });
});
