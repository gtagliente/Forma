import { ClipboardList, Dumbbell, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Thin bar rendered once above every authenticated route (/, /routine/:id,
// /workout/:id, /exercises, /workouts) via ProtectedRoute - the
// "persistent, always-visible logged-in indicator" the requirements call
// for, without touching those pages' own JSX.
export const AppHeader = () => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
      <span className="text-sm text-gray-300">{user?.email}</span>
      <div className="flex items-center gap-4">
        <Link
          to="/workouts"
          className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ClipboardList size={14} />
          Workout
        </Link>
        <Link
          to="/exercises"
          className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400 hover:text-white transition-colors"
        >
          <Dumbbell size={14} />
          Esercizi
        </Link>
        <button
          onClick={() => { void logout(); }}
          className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400 hover:text-white transition-colors"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </div>
  );
};
