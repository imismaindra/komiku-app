import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import { deleteSession, getSessionByToken, getUserById } from '@/database/db';
import { loginUser, registerUser } from '@/services/authApi';
import type { LoginRequest, RegisterRequest, User } from '@/types';

// ===== STATE =====
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

// ===== CONTEXT =====
interface AuthContextValue {
  state: AuthState;
  login: (data: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ===== PROVIDER =====
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on app start
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const session = await getSessionByToken(token);
      if (!session) {
        await AsyncStorage.removeItem('auth_token');
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const dbUser = await getUserById(session.user_id);
      if (!dbUser) {
        await AsyncStorage.removeItem('auth_token');
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      dispatch({
        type: 'SET_USER',
        payload: {
          id: dbUser.id,
          email: dbUser.email,
          username: dbUser.username,
          token,
          createdAt: dbUser.created_at,
        },
      });
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = useCallback(async (data: LoginRequest): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    const result = await loginUser(data);

    if (result.success && result.token && result.user) {
      await AsyncStorage.setItem('auth_token', result.token);
      dispatch({
        type: 'SET_USER',
        payload: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          token: result.token,
          createdAt: result.user.createdAt,
        },
      });
      return true;
    } else {
      dispatch({ type: 'SET_ERROR', payload: result.message ?? 'Login gagal' });
      return false;
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    const result = await registerUser(data);

    if (result.success && result.token && result.user) {
      await AsyncStorage.setItem('auth_token', result.token);
      dispatch({
        type: 'SET_USER',
        payload: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          token: result.token,
          createdAt: result.user.createdAt,
        },
      });
      return true;
    } else {
      dispatch({ type: 'SET_ERROR', payload: result.message ?? 'Registrasi gagal' });
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        await deleteSession(token);
        await AsyncStorage.removeItem('auth_token');
      }
    } catch {
      // ignore
    }
    dispatch({ type: 'LOGOUT' });
    router.replace('/(auth)/login');
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = useMemo(
    () => ({ state, login, register, logout, clearError }),
    [state, login, register, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ===== HOOK =====
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
