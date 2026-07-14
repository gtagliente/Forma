import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Wraps the authenticated route group. While the initial token check is in
// flight, renders a minimal placeholder to avoid a flash-redirect on
// refresh; once resolved, redirects to /login if not authenticated,
// otherwise renders its children (e.g. AppHeader) followed by the matched
// child route via <Outlet/>.
export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { pathname } = useLocation();

  if (isLoading) {
    return <div className="min-h-screen" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {children}
      {/* pb-24 clears the fixed bottom nav rendered by AppHeader so no page
          content ends up hidden underneath it. `key={pathname}` remounts
          this wrapper on every route change, which retriggers the
          animate-page-in fade defined in index.css - without it, a newly
          mounted page's content (still loading its own data) pops straight
          in at whatever height it happens to render, which reads as a
          jarring jump once the real data lands a beat later. */}
      <div key={pathname} className="pb-24 animate-page-in">
        <Outlet />
      </div>
    </>
  );
};
