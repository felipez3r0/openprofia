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

/**
 * Detecta o modo inicial baseado no ambiente
 * - Se não está no Tauri: usa 'local' (assume servidor rodando externamente)
 * - Se está no Tauri: usa 'embedded' (sidecar gerenciado pelo app)
 */
function getInitialMode(): ConnectionMode {
  const isTauri =
    typeof window !== 'undefined' &&
    typeof window.__TAURI_INTERNALS__ !== 'undefined';
  return isTauri ? 'embedded' : 'local';
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      mode: getInitialMode(),
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
      version: 3, // Incrementado para forçar ajuste de modo
      partialize: (state) => ({
        mode: state.mode,
        baseUrl: state.baseUrl,
        // NÃO persiste sidecarStatus - sempre inicia como 'stopped'
      }),
      migrate: (persistedState: any, version: number) => {
        console.log(
          '[ConnectionStore] Migrating from version',
          version,
          persistedState,
        );

        // Detecta se está no Tauri
        const isTauri =
          typeof window !== 'undefined' &&
          typeof window.__TAURI_INTERNALS__ !== 'undefined';

        // Para versões antigas, começa com modo correto
        if (version < 3) {
          const currentMode = persistedState?.mode ?? 'local';

          // Se o modo salvo é 'embedded' mas não está no Tauri, muda para 'local'
          const adjustedMode =
            currentMode === 'embedded' && !isTauri ? 'local' : currentMode;

          const migratedState = {
            mode: adjustedMode,
            baseUrl: persistedState?.baseUrl ?? DEFAULT_LOCAL_URL,
            sidecarStatus: 'stopped' as SidecarStatus,
          };
          console.log('[ConnectionStore] Migrated to v3:', migratedState);
          return migratedState;
        }

        // Para v3+, sempre valida o modo baseado no ambiente atual
        const currentMode = (persistedState as ConnectionState).mode;
        const adjustedMode =
          currentMode === 'embedded' && !isTauri ? 'local' : currentMode;

        const migratedState = {
          ...(persistedState as ConnectionState),
          mode: adjustedMode,
          sidecarStatus: 'stopped' as SidecarStatus,
        };
        console.log('[ConnectionStore] Validated state:', migratedState);
        return migratedState;
      },
    },
  ),
);
