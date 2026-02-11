import type { ApiClient } from './client';

interface HealthStatus {
  status: string;
  timestamp: string;
}

interface DetailedHealthStatus extends HealthStatus {
  services: {
    ollama: string;
    database: string;
    lancedb: string;
  };
}

export function createHealthApi(client: ApiClient) {
  return {
    async check(): Promise<HealthStatus> {
      const response = await client.healthCheck<HealthStatus>('/health');
      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Health check failed');
      }
      return response.data;
    },

    async detailed(): Promise<DetailedHealthStatus> {
      const response =
        await client.healthCheck<DetailedHealthStatus>('/health/detailed');
      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Detailed health check failed');
      }
      return response.data;
    },
  };
}

export type HealthApi = ReturnType<typeof createHealthApi>;
