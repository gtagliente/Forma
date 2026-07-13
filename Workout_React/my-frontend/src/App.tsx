import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import type { Workout } from './types';
import { RoutineList } from './pages/RoutineList';
import { RoutineDetail } from './pages/RoutineDetail';
import { WorkoutDetail } from './pages/WorkoutDetails';
import { WorkoutsPage } from './pages/WorkoutsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/Layout/ProtectedRoute';
import { AppHeader } from './components/Layout/AppHeader';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ExerciseLibrary } from './pages/ExerciseLibrary';
import { listWorkouts } from './lib/api/workoutApi';

// Dati mockati (identici a prima ma con struttura set)
// const initialWorkouts: Workout[] = [{
//   "id": "1",
//   "title": "Giorno Spinta",
//   "exercises": [
//     {
//       "id": "e1",
//       "name": "Panca Piana",
//       "sets": [
//         {
//           "id": "s1",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//         {
//           "id": "s2",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//         {
//           "id": "s3",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//         {
//           "id": "s4",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//         {
//           "id": "s5",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//       ]
//     },
//     {
//       "id": "e2",
//       "name": "Panca Inclinata",
//       "sets": [
//         {
//           "id": "s1",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//         {
//           "id": "s2",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         }
//       ]
//     },
//     {
//       "id": "e2",
//       "name": "Alzate laterali",
//       "sets": [
//         {
//           "id": "s1",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//         {
//           "id": "s2",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         }
//       ]
//     },
//     {
//       "id": "e2",
//       "name": "Crunches",
//       "sets": [
//         {
//           "id": "s1",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//         {
//           "id": "s2",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         }
//       ]
//     }
//   ]
// },
// {
//   "id": "2",
//   "title": "Giorno Gambe",
//   "exercises": [
//     {
//       "id": "e1",
//       "name": "Squat",
//       "sets": [
//         {
//           "id": "s1",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//         {
//           "id": "s2",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//         {
//           "id": "s3",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//       ]
//     },
//     {
//       "id": "e2",
//       "name": "Leg Press",
//       "sets": [
//         {
//           "id": "s1",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//         {
//           "id": "s2",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         }
//       ]
//     }
//   ]
// },
// {
//   "id": "2",
//   "title": "Giorno Dorso",
//   "exercises": [
//     {
//       "id": "e1",
//       "name": "Pull Up",
//       "sets": [
//         {
//           "id": "s1",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//         {
//           "id": "s2",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//         {
//           "id": "s3",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//       ]
//     },
//     {
//       "id": "e2",
//       "name": "Rematore",
//       "sets": [
//         {
//           "id": "s1",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//         {
//           "id": "s2",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         }
//       ]
//     }
//   ]
// },
// {
//   "id": "2",
//   "title": "Giorno Mobilità",
//   "exercises": [
//     {
//       "id": "e1",
//       "name": "Stretching SpalleW",
//       "sets": [
//         {
//           "id": "s1",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//         {
//           "id": "s2",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//         {
//           "id": "s3",
//           "setNumber": 1,
//           "reps": 10,
//           "durationSeconds": 0,
//           "pauseSeconds": 90
//         },
//       ]
//     }
//   ]
// }];



// Rendered inside AuthProvider (unlike previously, when Routes sat directly
// under it) so it can call useAuth() - the workouts fetch needs
// requestingUserId = user.id. Lifts `workouts` state (used by the
// /workout/:id and /workouts routes only); a sibling `refreshWorkouts`
// re-runs the same call and is passed down to both write flows
// (create/add-version), since neither endpoint returns updated data.
// FT-004: routines are no longer lifted here at all - RoutineList and
// RoutineDetail each self-fetch (routines + their own workout list) on
// mount per the design's no-shared-cache decision, so no `routines` prop is
// threaded to any route.
function AppContent() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const refreshWorkouts = useCallback(async () => {
    if (!user) {
      setWorkouts([]);
      return;
    }
    try {
      const result = await listWorkouts(user.id);
      setWorkouts(result);
    } catch {
      // Best-effort: a failed refresh just leaves the previous in-memory
      // list in place rather than clearing the screen.
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      await refreshWorkouts();
    };
    void load();
  }, [refreshWorkouts]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute><AppHeader /></ProtectedRoute>}>
        <Route path="/" element={<RoutineList />} />

        {/* Nuova rotta per il dettaglio */}
        <Route path="/routine/:id" element={<RoutineDetail />} />
        <Route path="/workout/:id" element={<WorkoutDetail workouts={workouts} refreshWorkouts={refreshWorkouts} />} />
        <Route path="/workouts" element={<WorkoutsPage workouts={workouts} refreshWorkouts={refreshWorkouts} />} />
        <Route path="/exercises" element={<ExerciseLibrary />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
     <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;