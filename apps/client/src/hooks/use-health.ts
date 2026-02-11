import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@/providers/connection-provider';
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
  const { healthApi } = useApi();
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
    const interval = setInterval(check, HEALTH_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [check]);

  return { ...state, refresh: check };
}
