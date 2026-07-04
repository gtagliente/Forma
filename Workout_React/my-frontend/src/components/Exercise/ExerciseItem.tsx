import { useState } from 'react';
import type { Exercise, ExerciseSet } from '../../types';
import { ChevronDown, Plus, Minus, Settings2 } from 'lucide-react';

export const ExerciseItem = ({ exercise: initialExercise }: { exercise: Exercise }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sets, setSets] = useState<ExerciseSet[]>(initialExercise.sets);
  const [showGenericRest, setShowGenericRest] = useState(false);
  // Aggiungi questi stati insieme a quelli esistenti
  const [showMenu, setShowMenu] = useState(false);
  const [genericRestTime, setGenericRestTime] = useState(60);
  const [tempGenericRest, setTempGenericRest] = useState(showGenericRest); // Stato temporaneo per il menu
  // const [tempTime, setTempTime] = useState(genericRestTime); // Stato temporaneo per il range

  const addSet = () => {
    const newSet: ExerciseSet = { id: Math.random().toString(), reps: 10, durationSeconds: 60, pauseSeconds: 90 };
    setSets([...sets, newSet]);
  };

  const removeSet = () => {
    if (sets.length > 1) setSets(sets.slice(0, -1));
  };

  return (
    <div className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {showMenu && (
        <div
          className="absolute inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-all"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex justify-between items-center text-white hover:bg-gray-700/50 transition-colors"
      >
        <span className="font-semibold text-sm">{initialExercise.name}</span>
        <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Transizione morbida */}
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="p-4 border-t border-gray-700/50 bg-gray-900/50">

            {/* Controllo Set */}
            <div className="flex items-center justify-between mb-4 bg-gray-950 p-2 rounded-lg border border-gray-700 relative">
              <span className="text-[10px] text-gray-400 uppercase font-bold px-2">{sets.length} SETS</span>
              <div className="flex gap-1">
                <button onClick={removeSet} className="p-1.5 hover:bg-gray-700 rounded text-gray-300"><Minus size={14} /></button>
                <button onClick={addSet} className="p-1.5 hover:bg-gray-700 rounded text-gray-300"><Plus size={14} /></button>
                <div className="relative">
                  <button onClick={() => setShowMenu(!showMenu)} className={`p-1.5 rounded ${showGenericRest ? 'text-blue-400 bg-gray-700' : 'text-gray-300'}`}>
                    <Settings2 size={14} />
                  </button>

                  {/* // 2. Modifica la modale (il blocco showMenu && ...) */}
                  {showMenu
                    && (
                      <>
                        {/* BACKDROP: copre tutto, scurisce lo sfondo e intercetta i click */}
                        {/* <div
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowMenu(false)}
                      /> */}

                        {/* // Cambia in: absolute -top-2 right-0 per farla apparire sopra o appena sopra
                      // Usa z-50 per sovrapporla a tutto */}
                        <div className="absolute top-10 right-0 w-56 bg-gray-800 border border-gray-600 rounded-xl p-4 z-50 shadow-2xl">

                          {/* Triangolino opzionale per puntare all'icona (opzionale) */}
                          <div className="absolute -top-2 right-4 w-4 h-4 bg-gray-800 border-t border-l border-gray-600 rotate-45"></div>

                          <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-white">Recupero Generale</span>
                            <button onClick={() => setTempGenericRest(!tempGenericRest)}
                              className={`w-9 h-5 rounded-full transition-colors ${tempGenericRest ? 'bg-blue-600' : 'bg-gray-600'}`}>
                              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${tempGenericRest ? 'translate-x-4' : ''}`} />
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <button onClick={() => setShowMenu(false)} className="flex-1 py-1.5 bg-gray-700 rounded-lg text-xs text-gray-300">
                              Annulla
                            </button>
                            <button onClick={() => {
                              setShowGenericRest(tempGenericRest);
                              setShowMenu(false);
                            }} className="flex-1 py-1.5 bg-blue-600 rounded-lg text-xs text-white">
                              Applica
                            </button>
                          </div>
                        </div>

                      </>

                    )}

                </div>
              </div>
            </div>




            {/* Lista Set */}
            {sets.map((set, idx) => (
              <>
                <span className="pl-10 mb-2 text-left font-bold text-gray-500 text-xs w-full block">S{idx + 1}</span>
                <div key={set.id} className={`grid gap-2 mb-2 text-sm items-center ${showGenericRest ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  <input type="number" defaultValue={set.reps} className="bg-gray-950 border border-gray-600 p-2 rounded-lg text-white focus:border-blue-500 outline-none transition-all" placeholder="Reps" />
                  <input type="number" defaultValue={0} className="bg-gray-950 border border-gray-600 p-2 rounded-lg text-white focus:border-blue-500 outline-none transition-all" placeholder="Durata" />
                  {!showGenericRest && (
                    <input type="number" defaultValue={set.pauseSeconds} className="bg-gray-950 border border-gray-600 p-2 rounded-lg text-white focus:border-blue-500 outline-none transition-all col-span-1" placeholder="Pause" />
                  )}
                </div>
              </>
            ))}

            {/* Recupero Generico */}
            {showGenericRest && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <label className="text-[10px] text-gray-400 uppercase block mb-2">Recupero Generale (tutti i set)</label>
                <input type="range" min="0" max="180" step="10" className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" value={genericRestTime}
                  onChange={(e) => setGenericRestTime(parseInt(e.target.value))} />
                <div className="text-center text-xs text-blue-400 mt-2 font-mono">{genericRestTime} sec</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};