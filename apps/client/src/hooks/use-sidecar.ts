import { useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useConnectionStore } from '@/stores/connection.store';

/**
 * Hook para gerenciar o lifecycle do sidecar server
 * Detecta se está rodando em Tauri e fornece funções para start/stop
 */
export function useSidecar() {
  const { mode, setSidecarStatus, sidecarStatus } = useConnectionStore();

  // Detecta se está em ambiente Tauri - No Tauri v2, verifica __TAURI_INTERNALS__
  const isTauri = (() => {
    try {
      return (
        typeof window !== 'undefined' &&
        typeof window.__TAURI_INTERNALS__ !== 'undefined'
      );
    } catch {
      return false;
    }
  })();

  console.log('[Sidecar] Hook initialized:', { isTauri, mode, sidecarStatus });

  // Reseta o status ao montar se estiver em estado inconsistente
  useEffect(() => {
    if (isTauri && mode === 'embedded' && sidecarStatus === 'starting') {
      console.log('[Sidecar] Resetting stuck "starting" status to "stopped"');
      setSidecarStatus('stopped');
    }
  }, []); // Executa apenas na montagem

  // Log sempre que o status mudar
  useEffect(() => {
    console.log('[Sidecar] Status changed to:', sidecarStatus);
  }, [sidecarStatus]);

  /**
   * Inicia o sidecar server
   */
  const startSidecar = useCallback(async () => {
    if (!isTauri) {
      console.warn('[Sidecar] Not running in Tauri, cannot start sidecar');
      return false;
    }

    try {
      console.log('[Sidecar] Starting sidecar...');
      setSidecarStatus('starting');

      const result = await invoke<string>('start_sidecar');
      console.log('[Sidecar] Invoke result:', result);

      if (result === 'already_running') {
        console.log('[Sidecar] Already running');
        setSidecarStatus('running');
        return true;
      }

      if (result === 'started') {
        console.log('[Sidecar] Started, waiting for health check...');

        // Aguarda um pouco antes de começar o polling para dar tempo do servidor iniciar
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Aguarda o servidor ficar pronto (polling no health check)
        const maxAttempts = 60; // 30s timeout (500ms * 60)
        let attempts = 0;

        while (attempts < maxAttempts) {
          try {
            console.log(
              `[Sidecar] Health check attempt ${attempts + 1}/${maxAttempts}...`,
            );
            const response = await fetch('http://localhost:3000/health');
            console.log(`[Sidecar] Health response status: ${response.status}`);
            if (response.ok) {
              const data = await response.json();
              console.log('[Sidecar] Health check OK, server is ready:', data);
              setSidecarStatus('running');
              return true;
            }
          } catch (err) {
            console.log(
              `[Sidecar] Health check attempt ${attempts + 1}/${maxAttempts} failed:`,
              err instanceof Error ? err.message : String(err),
            );
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
          attempts++;
        }

        // Timeout
        console.error('[Sidecar] Timeout waiting for server to start');
        setSidecarStatus('error');
        return false;
      }

      console.error('[Sidecar] Unexpected result:', result);
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
      console.log('[Sidecar] Stopping sidecar...');
      const result = await invoke<string>('stop_sidecar');
      console.log('[Sidecar] Stop result:', result);

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
      console.log('[Sidecar] Running check:', isRunning);

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
    console.log('[Sidecar] Auto-start effect triggered:', {
      mode,
      isTauri,
      sidecarStatus,
    });

    if (mode === 'embedded' && isTauri && sidecarStatus === 'stopped') {
      console.log('[Sidecar] Auto-starting in embedded mode');
      startSidecar();
    }
  }, [mode, isTauri, sidecarStatus, startSidecar]);

  /**
   * Auto-stop sidecar quando mudar de modo
   */
  useEffect(() => {
    return () => {
      if (mode === 'embedded' && isTauri && sidecarStatus === 'running') {
        console.log('[Sidecar] Cleanup: stopping sidecar');
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
