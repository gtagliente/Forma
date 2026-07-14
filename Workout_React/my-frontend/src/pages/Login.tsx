import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const registered = Boolean((location.state as { registered?: boolean } | null)?.registered);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      // Error message is surfaced via `error` from useAuth().
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || email.trim() === '' || password === '';

  return (
    <div className="p-4 max-w-screen-xl min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1220]/80 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <h1 className="text-white font-bold text-xl mb-4">Login</h1>

        {registered && (
          <p className="text-blue-400 text-sm mb-4">Registered — please log in.</p>
        )}

        <form onSubmit={handleSubmit} className="grid gap-3">
          <div>
            <label htmlFor="login-email" className="block text-xs text-gray-400 mb-1">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-950 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs text-gray-400 mb-1">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-950 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isDisabled}
            className="mt-2 rounded-lg bg-blue-400 text-gray-950 font-bold text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-300 transition-all"
          >
            {isSubmitting ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="text-gray-400 text-xs mt-4">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};
