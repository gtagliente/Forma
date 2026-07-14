import { ClipboardList, Dumbbell, LogOut, LayoutGrid } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Routine', icon: LayoutGrid },
  { to: '/workouts', label: 'Workout', icon: ClipboardList },
  { to: '/exercises', label: 'Esercizi', icon: Dumbbell },
];

// Thin identity bar + bottom tab bar rendered once above every authenticated
// route (/, /routine/:id, /workout/:id, /exercises, /workouts) via
// ProtectedRoute - the "persistent, always-visible logged-in indicator" the
// requirements call for, without touching those pages' own JSX. Navigation
// lives in the fixed bottom bar (position: fixed removes it from flow;
// ProtectedRoute adds matching bottom padding around <Outlet/> so page
// content never sits underneath it); the top bar is reduced to identity +
// logout only.
export const AppHeader = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[#070a12]/70 px-4 py-3 backdrop-blur-md">
        <span className="text-sm text-gray-300">{user?.email}</span>
        <button
          onClick={() => { void logout(); }}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold uppercase text-gray-400 transition-colors hover:text-white"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
        <div className="flex w-full max-w-md items-center justify-around gap-1 rounded-2xl border border-white/10 bg-[#0b101c]/90 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
