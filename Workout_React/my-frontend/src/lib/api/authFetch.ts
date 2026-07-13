import { getToken } from './token';

// Wraps fetch, attaching `Authorization: Bearer <token>` when a token is
// present in storage. Otherwise behaves like a plain fetch call. This is
// the reusable pattern later features plug into for exercise-service /
// training-planning-service once those start enforcing JWT — it doesn't
// know or care which backend it's calling.
export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();

  if (!token) {
    return fetch(url, init);
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(url, { ...init, headers });
}
