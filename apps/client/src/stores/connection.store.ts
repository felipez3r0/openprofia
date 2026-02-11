import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConnectionMode } from '@/types';
import { DEFAULT_LOCAL_URL } from '@/config/constants';

interface ConnectionState {
  mode: ConnectionMode;
  baseUrl: string;
  setMode: (mode: ConnectionMode) => void;
  setBaseUrl: (url: string) => void;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      mode: 'local',
      baseUrl: DEFAULT_LOCAL_URL,
      setMode: (mode) =>
        set({
          mode,
          baseUrl: mode === 'local' ? DEFAULT_LOCAL_URL : '',
        }),
      setBaseUrl: (baseUrl) => set({ baseUrl }),
    }),
    { name: 'openprofia-connection' },
  ),
);
