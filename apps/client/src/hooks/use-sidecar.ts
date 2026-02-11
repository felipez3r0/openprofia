import { useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useConnectionStore } from '@/stores/connection.store';

/**
 * Hook para gerenciar o lifecycle do sidecar server
 * Detecta se está rodando em Tauri e fornece funções para start/stop
 */
export function useSidecar() {
  const { mode, setSidecarStatus, sidecarStatus } = useConnectionStore();

  // Detecta se está em ambiente Tauri
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

  /**
   * Inicia o sidecar server
   */
  const startSidecar = useCallback(async () => {
    if (!isTauri) {
      console.warn('[Sidecar] Not running in Tauri, cannot start sidecar');
      return false;
    }

    try {
      setSidecarStatus('starting');

      const result = await invoke<string>('start_sidecar');

      if (result === 'already_running') {
        setSidecarStatus('running');
        return true;
      }

      if (result === 'started') {
        // Aguarda o servidor ficar pronto (polling no health check)
        const maxAttempts = 60; // 30s timeout (500ms * 60)
        let attempts = 0;

        while (attempts < maxAttempts) {
          try {
            const response = await fetch('http://localhost:3000/health');
            if (response.ok) {
              setSidecarStatus('running');
              return true;
            }
          } catch {
            // Server ainda não está pronto, continua tentando
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
          attempts++;
        }

        // Timeout
        setSidecarStatus('error');
        console.error('[Sidecar] Timeout waiting for server to start');
        return false;
      }

      setSidecarStatus('error');
      return false;
    } catch (error) {
      console.error('[Sidecar] Failed to start:', error);
      setSidecarStatus('error');
      return false;
    }
  }, [isTauri, setSidecarStatus]);

  /**
   * Para o sidecar server
   */
  const stopSidecar = useCallback(async () => {
    if (!isTauri) {
      return false;
    }

    try {
      const result = await invoke<string>('stop_sidecar');

      if (result === 'stopped' || result === 'not_running') {
        setSidecarStatus('stopped');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Sidecar] Failed to stop:', error);
      return false;
    }
  }, [isTauri, setSidecarStatus]);

  /**
   * Verifica se o sidecar está rodando
   */
  const checkSidecarRunning = useCallback(async () => {
    if (!isTauri) {
      return false;
    }

    try {
      const isRunning = await invoke<boolean>('is_sidecar_running');

      if (isRunning && sidecarStatus !== 'running') {
        setSidecarStatus('running');
      } else if (!isRunning && sidecarStatus === 'running') {
        setSidecarStatus('stopped');
      }

      return isRunning;
    } catch (error) {
      console.error('[Sidecar] Failed to check status:', error);
      return false;
    }
  }, [isTauri, sidecarStatus, setSidecarStatus]);

  /**
   * Auto-start sidecar quando modo for 'embedded'
   */
  useEffect(() => {
    if (mode === 'embedded' && isTauri && sidecarStatus === 'stopped') {
      startSidecar();
    }
  }, [mode, isTauri, sidecarStatus, startSidecar]);

  /**
   * Auto-stop sidecar quando mudar de modo
   */
  useEffect(() => {
    return () => {
      if (mode === 'embedded' && isTauri && sidecarStatus === 'running') {
        stopSidecar();
      }
    };
  }, [mode, isTauri, sidecarStatus, stopSidecar]);

  return {
    isTauri,
    sidecarStatus,
    startSidecar,
    stopSidecar,
    checkSidecarRunning,
  };
}
