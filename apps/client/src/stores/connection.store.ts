import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConnectionMode } from '@/types';
import { DEFAULT_LOCAL_URL } from '@/config/constants';

export type SidecarStatus = 'stopped' | 'starting' | 'running' | 'error';

interface ConnectionState {
  mode: ConnectionMode;
  baseUrl: string;
  sidecarStatus: SidecarStatus;
  setMode: (mode: ConnectionMode) => void;
  setBaseUrl: (url: string) => void;
  setSidecarStatus: (status: SidecarStatus) => void;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      mode: 'embedded',
      baseUrl: DEFAULT_LOCAL_URL,
      sidecarStatus: 'stopped',

      setMode: (mode) =>
        set({
          mode,
          baseUrl:
            mode === 'embedded' || mode === 'local' ? DEFAULT_LOCAL_URL : '',
        }),

      setBaseUrl: (baseUrl) => set({ baseUrl }),

      setSidecarStatus: (sidecarStatus) => set({ sidecarStatus }),
    }),
    {
      name: 'openprofia-connection',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Migração da v0 (sem embedded) para v1 (com embedded)
        if (version === 0) {
          const oldState = persistedState as {
            mode: 'local' | 'remote';
            baseUrl: string;
          };
          return {
            ...oldState,
            mode: oldState.mode === 'local' ? 'embedded' : oldState.mode,
            sidecarStatus: 'stopped' as SidecarStatus,
          };
        }
        return persistedState as ConnectionState;
      },
    },
  ),
);
