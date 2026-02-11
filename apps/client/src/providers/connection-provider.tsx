import { useMemo, type ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { ApiClient } from '@/api/client';
import { createChatApi, type ChatApi } from '@/api/chat.api';
import { createSkillsApi, type SkillsApi } from '@/api/skills.api';
import { createDocumentsApi, type DocumentsApi } from '@/api/documents.api';
import { createHealthApi, type HealthApi } from '@/api/health.api';
import { createSettingsApi, type SettingsApi } from '@/api/settings.api';
import { useConnectionStore } from '@/stores/connection.store';
import { useSidecar } from '@/hooks/use-sidecar';
import type { SidecarStatus } from '@/stores/connection.store';

interface ApiContextValue {
  client: ApiClient;
  chatApi: ChatApi;
  skillsApi: SkillsApi;
  documentsApi: DocumentsApi;
  healthApi: HealthApi;
  settingsApi: SettingsApi;
  sidecarStatus: SidecarStatus;
  isTauri: boolean;
}

const ApiContext = createContext<ApiContextValue | null>(null);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const baseUrl = useConnectionStore((s) => s.baseUrl);

  // Gerencia sidecar lifecycle automaticamente baseado no modo
  const { sidecarStatus, isTauri } = useSidecar();

  const apis = useMemo(() => {
    const client = new ApiClient(baseUrl);
    return {
      client,
      chatApi: createChatApi(client),
      skillsApi: createSkillsApi(client),
      documentsApi: createDocumentsApi(client),
      healthApi: createHealthApi(client),
      settingsApi: createSettingsApi(client),
      sidecarStatus,
      isTauri,
    };
  }, [baseUrl, sidecarStatus, isTauri]);

  return <ApiContext.Provider value={apis}>{children}</ApiContext.Provider>;
}

export function useApi(): ApiContextValue {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within a ConnectionProvider');
  }
  return context;
}
