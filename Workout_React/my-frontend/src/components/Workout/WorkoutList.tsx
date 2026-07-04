// type Workout = {
//   id: string | number;
//   title: string;
//   exercises: unknown[];
// };

// export default function WorkoutList({ workouts }: { workouts: Workout[] }) {
//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold mb-4">I tuoi Workout</h2>
//       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//         {workouts.map((workout) => (
//           <div key={workout.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
//             <h3 className="font-semibold text-lg">{workout.title}</h3>
//             <p className="text-gray-600">{workout.exercises.length} esercizi</p>
//             <button className="mt-4 text-blue-500 hover:underline">Vedi dettagli</button>
//           </div>

          
//         ))}
//       </div>
//     </div>
//   );
// }