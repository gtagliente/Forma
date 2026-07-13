import { useState } from 'react';
import type { Exercise, MuscleGroup } from '../../types';

const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'FullBody'];

type ExerciseFormInput = {
  name: string;
  description: string;
  muscleGroups: MuscleGroup[];
};

type ExerciseFormProps = {
  onSave: (input: ExerciseFormInput) => void;
  // Pre-fills all three fields when editing; the container decides
  // create-vs-update by whether it opened the panel with an initialValue.
  initialValue?: Exercise;
};

export default function ExerciseForm({ onSave, initialValue }: ExerciseFormProps) {
  const [name, setName] = useState(initialValue?.name ?? '');
  const [description, setDescription] = useState(initialValue?.description ?? '');
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>(initialValue?.muscleGroups ?? []);

  const toggleMuscleGroup = (group: MuscleGroup) => {
    setMuscleGroups((current) =>
      current.includes(group) ? current.filter((g) => g !== group) : [...current, group],
    );
  };

  return (
    <form
      className="bg-gray-900 p-6 rounded-lg border border-gray-700"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ name, description, muscleGroups });
      }}
    >
      <label className="block mb-2 font-medium text-gray-300">Nome Esercizio</label>
      <input
        type="text"
        className="w-full p-2 border border-gray-600 rounded mb-4 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="es. Panca Piana"
      />

      <label className="block mb-2 font-medium text-gray-300">Descrizione</label>
      <textarea
        className="w-full p-2 border border-gray-600 rounded mb-4 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="es. Esercizio per il petto"
      />

      <label className="block mb-2 font-medium text-gray-300">Gruppi Muscolari</label>
      <div className="flex flex-wrap gap-3 mb-4">
        {MUSCLE_GROUPS.map((group) => (
          <label key={group} className="flex items-center gap-1 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={muscleGroups.includes(group)}
              onChange={() => toggleMuscleGroup(group)}
            />
            {group}
          </label>
        ))}
      </div>

      <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
        {initialValue ? 'Salva' : 'Aggiungi'}
      </button>
    </form>
  );
}
