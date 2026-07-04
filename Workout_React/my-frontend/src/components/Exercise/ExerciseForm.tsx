import { useState } from 'react';

type ExerciseFormProps = {
  onSave: (name: string) => void;
};

export default function ExerciseForm({ onSave }: ExerciseFormProps) {
  const [name, setName] = useState('');

  return (
    <form className="bg-gray-50 p-6 rounded-lg border" onSubmit={(e) => { e.preventDefault(); onSave(name); }}>
      <label className="block mb-2 font-medium">Nome Esercizio</label>
      <input 
        type="text" 
        className="w-full p-2 border rounded mb-4"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="es. Panca Piana"
      />
      <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
        Aggiungi
      </button>
    </form>
  );
}