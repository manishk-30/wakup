import { useState, useEffect } from 'react';

let listeners: ((soundId: string) => void)[] = [];
let currentSoundId: string | null = null;

export const soundSelectionStore = {
  setSound: (id: string) => {
    currentSoundId = id;
    listeners.forEach(l => l(id));
  },
  useSound: (initialSoundId: string) => {
    // If we haven't selected anything yet, default to the initial value passed by the form
    const [soundId, setSoundId] = useState(currentSoundId || initialSoundId);
    
    useEffect(() => {
      // Sync initial state if it's the first time
      if (!currentSoundId) {
        currentSoundId = initialSoundId;
      } else if (soundId !== currentSoundId) {
        setSoundId(currentSoundId);
      }

      const listener = (id: string) => setSoundId(id);
      listeners.push(listener);
      return () => {
        listeners = listeners.filter(l => l !== listener);
      };
    }, [initialSoundId, soundId]);

    return [soundId, soundSelectionStore.setSound] as const;
  },
  clear: () => {
    currentSoundId = null;
  }
};
