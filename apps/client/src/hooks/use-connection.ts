import { useConnectionStore } from '@/stores/connection.store';

export function useConnection() {
  const mode = useConnectionStore((s) => s.mode);
  const baseUrl = useConnectionStore((s) => s.baseUrl);
  const setMode = useConnectionStore((s) => s.setMode);
  const setBaseUrl = useConnectionStore((s) => s.setBaseUrl);

  return { mode, baseUrl, setMode, setBaseUrl };
}
