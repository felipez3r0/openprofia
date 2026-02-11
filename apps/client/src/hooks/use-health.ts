import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@/providers/connection-provider';
import { useConnectionStore } from '@/stores/connection.store';
import { HEALTH_POLL_INTERVAL_MS } from '@/config/constants';

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

  const check = useCallback(async () => {
    setState((prev) => ({ ...prev, isChecking: true }));
    try {
      const data = await healthApi.detailed();
      setState({
        connected: true,
        ollama: data.services.ollama,
        database: data.services.database,
        lancedb: data.services.lancedb,
        isChecking: false,
      });
    } catch {
      setState({
        connected: false,
        ollama: 'unknown',
        database: 'unknown',
        lancedb: 'unknown',
        isChecking: false,
      });
    }
  }, [healthApi]);

  useEffect(() => {
    check();

    // Usa polling mais rápido (1s) quando sidecar está starting
    const pollInterval =
      mode === 'embedded' && sidecarStatus === 'starting'
        ? 1000
        : HEALTH_POLL_INTERVAL_MS;

    const interval = setInterval(check, pollInterval);
    return () => clearInterval(interval);
  }, [check, mode, sidecarStatus]);

  return { ...state, refresh: check };
}
