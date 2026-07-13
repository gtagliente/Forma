import type { User } from '../../types';
import { AUTH_API_BASE_URL } from './config';
import { authFetch } from './authFetch';

// The only module that knows Forma.Auth's actual endpoints and error shapes.
// Callers (AuthContext) get a typed AuthApiError to branch on instead of
// raw Response/ErrorModel shapes.

export type AuthErrorCode =
  | 'LOGIN_BAD_CREDENTIALS'
  | 'LOGIN_USER_NOT_VERIFIED'
  | 'REGISTER_USER_ALREADY_EXISTS'
  | 'REGISTER_INVALID_PASSWORD'
  | 'UNKNOWN_ERROR';

export class AuthApiError extends Error {
  code: AuthErrorCode;
  /** Backend-provided detail.reason, only set for REGISTER_INVALID_PASSWORD. */
  reason?: string;

  constructor(code: AuthErrorCode, message: string, reason?: string) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
    this.reason = reason;
  }
}

export interface BearerResponse {
  access_token: string;
  token_type: string;
}

interface UserRead {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
}

function mapUser(userRead: UserRead): User {
  return { id: userRead.id, email: userRead.email };
}

// POST /auth/jwt/login — application/x-www-form-urlencoded, username/password.
// 200 -> {access_token, token_type}. 400 -> LOGIN_BAD_CREDENTIALS | LOGIN_USER_NOT_VERIFIED.
export async function login(email: string, password: string): Promise<BearerResponse> {
  const body = new URLSearchParams();
  body.set('username', email);
  body.set('password', password);

  const response = await authFetch(`${AUTH_API_BASE_URL}/auth/jwt/login`, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    if (response.status === 400) {
      const data = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (data?.detail === 'LOGIN_USER_NOT_VERIFIED') {
        throw new AuthApiError('LOGIN_USER_NOT_VERIFIED', 'Login failed: user not verified.');
      }
      throw new AuthApiError('LOGIN_BAD_CREDENTIALS', 'Login failed: bad credentials.');
    }
    throw new AuthApiError('UNKNOWN_ERROR', `Login failed with status ${response.status}.`);
  }

  return (await response.json()) as BearerResponse;
}

// POST /auth/register — JSON {email, password}. No token yet, so no authFetch.
// 201 -> UserRead. 400 -> REGISTER_USER_ALREADY_EXISTS | REGISTER_INVALID_PASSWORD (detail.reason).
export async function register(email: string, password: string): Promise<User> {
  const response = await fetch(`${AUTH_API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    if (response.status === 400) {
      const data = (await response.json().catch(() => null)) as { detail?: unknown } | null;
      const detail = data?.detail;

      if (detail === 'REGISTER_USER_ALREADY_EXISTS') {
        throw new AuthApiError('REGISTER_USER_ALREADY_EXISTS', 'Registration failed: user already exists.');
      }

      if (detail && typeof detail === 'object' && 'code' in detail) {
        const detailObj = detail as { code?: string; reason?: string };
        if (detailObj.code === 'REGISTER_INVALID_PASSWORD') {
          throw new AuthApiError(
            'REGISTER_INVALID_PASSWORD',
            'Registration failed: invalid password.',
            detailObj.reason,
          );
        }
      }
    }
    throw new AuthApiError('UNKNOWN_ERROR', `Registration failed with status ${response.status}.`);
  }

  const data = (await response.json()) as UserRead;
  return mapUser(data);
}

// POST /auth/jwt/logout — bearer token attached, no body. 200 on success, 401 if dead/missing token.
export async function logout(): Promise<void> {
  const response = await authFetch(`${AUTH_API_BASE_URL}/auth/jwt/logout`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new AuthApiError('UNKNOWN_ERROR', `Logout failed with status ${response.status}.`);
  }
}

// GET /users/me — bearer token attached. 200 -> UserRead, 401 if no valid token.
export async function fetchCurrentUser(): Promise<User> {
  const response = await authFetch(`${AUTH_API_BASE_URL}/users/me`);

  if (!response.ok) {
    throw new AuthApiError('UNKNOWN_ERROR', `Fetching current user failed with status ${response.status}.`);
  }

  const data = (await response.json()) as UserRead;
  return mapUser(data);
}
