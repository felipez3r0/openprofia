import { useEffect, useState, useCallback, useRef } from 'react';
import { useApi } from '@/providers/connection-provider';
import { useConnectionStore } from '@/stores/connection.store';
import {
  HEALTH_POLL_INTERVAL_MS,
  HEALTH_POLL_FAST_MS,
} from '@/config/constants';

interface HealthState {
  connected: boolean;
  ollama: string;
  database: string;
  lancedb: string;
  isChecking: boolean;
}

const initialState: HealthState = {
  connected: false,
  ollama: 'unknown',
  database: 'unknown',
  lancedb: 'unknown',
  isChecking: true,
};

export function useHealth() {
  const { healthApi, sidecarStatus } = useApi();
  const mode = useConnectionStore((s) => s.mode);
  const [state, setState] = useState<HealthState>(initialState);
  const prevSidecarStatus = useRef(sidecarStatus);

  const check = useCallback(async () => {
    setState((prev) => ({ ...prev, isChecking: true }));
    try {
      console.log('[Health] Checking server health...');
      const data = await healthApi.detailed();
      console.log('[Health] Server healthy:', data);
      setState({
        connected: true,
        ollama: data.services.ollama,
        database: data.services.database,
        lancedb: data.services.lancedb,
        isChecking: false,
      });
    } catch (error) {
      console.warn('[Health] Server health check failed:', error);
      setState({
        connected: false,
        ollama: 'unknown',
        database: 'unknown',
        lancedb: 'unknown',
        isChecking: false,
      });
    }
  }, [healthApi]);

  // Health check imediato quando sidecar passar de 'starting' para 'running'
  useEffect(() => {
    if (
      prevSidecarStatus.current === 'starting' &&
      sidecarStatus === 'running'
    ) {
      console.log('[Health] Sidecar now running, checking health immediately');
      check();
    }
    prevSidecarStatus.current = sidecarStatus;
  }, [sidecarStatus, check]);

  useEffect(() => {
    check();

    // Usa polling mais rápido (2s) quando sidecar está starting, senão 10s
    const pollInterval =
      mode === 'embedded' && sidecarStatus === 'starting'
        ? HEALTH_POLL_FAST_MS
        : HEALTH_POLL_INTERVAL_MS;

    console.log(
      `[Health] Setting up polling every ${pollInterval}ms (status: ${sidecarStatus})`,
    );
    const interval = setInterval(check, pollInterval);
    return () => clearInterval(interval);
  }, [check, mode, sidecarStatus]);

  return { ...state, refresh: check };
}
