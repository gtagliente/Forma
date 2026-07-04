import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import type { Routine } from './types';
import { RoutineCard } from './components/Routine/RoutineCard';
import { RoutineDetail } from './pages/RoutineDetail';
import { WorkoutDetail } from './pages/WorkoutDetails';

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



const initialRoutines: Routine[] = [
  {
    id: "r1",
    name: "Training Forza Ipertrofia",
    workouts: [
      { id: "1", title: "Giorno Spinta", exercises: [{ id: 'ex1', name: 'Panca Piana', sets: [
        {
          "id": "s1",
          // "setNumber": 1,
          "reps": 10,
          "durationSeconds": 0,
          "pauseSeconds": 90
        },
        {
          "id": "s2",
          // "setNumber": 1,
          "reps": 10,
          "durationSeconds": 0,
          "pauseSeconds": 90
        },
        {
          "id": "s3",
          // "setNumber": 1,
          "reps": 10,
          "durationSeconds": 0,
          "pauseSeconds": 90
        }
      ] },
    { id: 'ex1', name: 'Panca Inclinata', sets: [
        {
          "id": "s1",
          // "setNumber": 1,
          "reps": 10,
          "durationSeconds": 0,
          "pauseSeconds": 90
        },
        {
          "id": "s2",
          // "setNumber": 1,
          "reps": 10,
          "durationSeconds": 0,
          "pauseSeconds": 90
        },
        {
          "id": "s3",
          // "setNumber": 1,
          "reps": 10,
          "durationSeconds": 0,
          "pauseSeconds": 90
        }
      ] },
    { id: 'ex1', name: 'Chest Press', sets: [
        {
          "id": "s1",
          // "setNumber": 1,
          "reps": 10,
          "durationSeconds": 0,
          "pauseSeconds": 90
        },
        {
          "id": "s2",
          // "setNumber": 1,
          "reps": 10,
          "durationSeconds": 0,
          "pauseSeconds": 90
        },
        {
          "id": "s3",
          // "setNumber": 1,
          "reps": 10,
          "durationSeconds": 0,
          "pauseSeconds": 90
        }
      ] },
    { id: 'ex1', name: 'Shoulder Press', sets: [
        {
          "id": "s1",
          // "setNumber": 1,
          "reps": 10,
          "durationSeconds": 0,
          "pauseSeconds": 90
        },
        {
          "id": "s2",
          // "setNumber": 1,
          "reps": 10,
          "durationSeconds": 0,
          "pauseSeconds": 90
        },
        {
          "id": "s3",
          // "setNumber": 1,
          "reps": 10,
          "durationSeconds": 0,
          "pauseSeconds": 90
        }
      ] }] },
      { id: "2", title: "Giorno Gambe", exercises: [{ id: 'ex2', name: 'Squat', sets: [] }] }
    ]
  }
];
function App() {
  const [routines] = useState(initialRoutines);

  return (
     <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div className="p-4 max-w-screen-xl  min-h-screen bg-gray-950">
            <h1 className="text-white font-bold text-xl mb-4">Le tue Schede</h1>
            {routines.map(r => <RoutineCard key={r.id} routine={r} />)}
          </div>
        } />
        
        {/* Nuova rotta per il dettaglio */}
        <Route path="/routine/:id" element={<RoutineDetail routines={routines} />} />
        <Route path="/workout/:id" element={<WorkoutDetail routines={routines} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;