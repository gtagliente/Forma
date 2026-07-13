import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  fetchCurrentUser,
  AuthApiError,
} from '../lib/api/authApi';
import { getToken, setToken, clearToken } from '../lib/api/token';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Maps a thrown AuthApiError to the user-facing copy this feature's screens
// need. REGISTER_INVALID_PASSWORD echoes the backend's own reason verbatim
// (password policy is backend-owned, not re-encoded here).
function toDisplayMessage(err: unknown): string {
  if (err instanceof AuthApiError) {
    switch (err.code) {
      case 'LOGIN_BAD_CREDENTIALS':
        return 'Incorrect email or password.';
      case 'LOGIN_USER_NOT_VERIFIED':
        return "This account hasn't been verified yet.";
      case 'REGISTER_USER_ALREADY_EXISTS':
        return 'An account with this email already exists.';
      case 'REGISTER_INVALID_PASSWORD':
        return err.reason ?? 'Invalid password.';
      default:
        return 'Something went wrong, please check your input.';
    }
  }
  return 'Something went wrong, please check your input.';
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from the stored token on first mount: the token is the single
  // source of truth, user is never persisted directly, so user.id is always
  // fresh from the backend rather than a stale local copy.
  useEffect(() => {
    const hydrate = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch {
        // Stored token is dead (401) - clear it and treat as logged out.
        clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void hydrate();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const { access_token: accessToken } = await apiLogin(email, password);
      setToken(accessToken);
      // The login response has no user info, only the token.
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch (err) {
      setError(toDisplayMessage(err));
      throw err;
    }
  };

  const register = async (email: string, password: string) => {
    setError(null);
    try {
      // Register doesn't return a token - no auto-login. Caller (Register
      // page) redirects to /login on success.
      await apiRegister(email, password);
    } catch (err) {
      setError(toDisplayMessage(err));
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // Best-effort: a dead/expired token would 401 on logout too, and
      // local logout must still succeed regardless.
    } finally {
      clearToken();
      setUser(null);
    }
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// AuthContext.tsx intentionally exports both the AuthProvider component and
// this hook, per design. That means this file trades away fast-refresh's
// component-only-export optimization (it'll full-reload instead of hot
// updating) - an accepted, standard trade-off for a Context+hook module.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
