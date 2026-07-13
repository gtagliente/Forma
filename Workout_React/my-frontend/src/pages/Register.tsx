import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await register(email, password);
      // Contract returns UserRead, no token - no auto-login. Redirect to
      // /login with a "registered" hint via router state.
      navigate('/login', { state: { registered: true } });
    } catch {
      // Error message is surfaced via `error` from useAuth().
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || email.trim() === '' || password === '';

  return (
    <div className="p-4 max-w-screen-xl min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-full max-w-sm border border-gray-600 rounded-lg p-6 bg-gray-800">
        <h1 className="text-white font-bold text-xl mb-4">Register</h1>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <div>
            <label htmlFor="register-email" className="block text-xs text-gray-400 mb-1">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-950 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label htmlFor="register-password" className="block text-xs text-gray-400 mb-1">
              Password
            </label>
            <input
              id="register-password"
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
            {isSubmitting ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="text-gray-400 text-xs mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};
