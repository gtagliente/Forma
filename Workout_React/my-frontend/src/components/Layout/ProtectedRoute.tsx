import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Wraps the authenticated route group. While the initial token check is in
// flight, renders a minimal placeholder to avoid a flash-redirect on
// refresh; once resolved, redirects to /login if not authenticated,
// otherwise renders its children (e.g. AppHeader) followed by the matched
// child route via <Outlet/>.
export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-gray-950" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {children}
      <Outlet />
    </>
  );
};
