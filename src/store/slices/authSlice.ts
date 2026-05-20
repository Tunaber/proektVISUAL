import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { AuthState, User } from '../../types';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    await new Promise((r) => setTimeout(r, 500));
    if (!email || !password) throw new Error('Invalid credentials');
    const user: User = {
      id: 'user_1',
      name: email.split('@')[0],
      email,
      createdAt: new Date().toISOString(),
    };
    return { user, accessToken: 'mock_token_' + Date.now() };
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ name, email, password }: { name: string; email: string; password: string }) => {
    await new Promise((r) => setTimeout(r, 500));
    if (!email || !password || !name) throw new Error('All fields required');
    const user: User = {
      id: 'user_' + Date.now(),
      name,
      email,
      createdAt: new Date().toISOString(),
    };
    return { user, accessToken: 'mock_token_' + Date.now() };
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setMockUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.accessToken = 'mock_token';
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      });
  },
});

export const { logout, setMockUser, clearError } = authSlice.actions;
export default authSlice.reducer;
