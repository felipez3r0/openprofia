import type { ISettingsMap } from '@/types';
import type { ApiClient } from './client';

export function createSettingsApi(client: ApiClient) {
  return {
    async getSettings(): Promise<Required<ISettingsMap>> {
      const response = await client.get<Required<ISettingsMap>>('/settings');
      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to fetch settings');
      }
      return response.data;
    },

    async updateSettings(
      data: Partial<ISettingsMap>,
    ): Promise<Required<ISettingsMap>> {
      const response = await client.put<Required<ISettingsMap>>(
        '/settings',
        data,
      );
      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to update settings');
      }
      return response.data;
    },

    async listOllamaModels(url?: string): Promise<string[]> {
      const query = url ? `?url=${encodeURIComponent(url)}` : '';
      const response = await client.get<string[]>(
        `/settings/ollama/models${query}`,
      );
      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to list Ollama models');
      }
      return response.data;
    },
  };
}

export type SettingsApi = ReturnType<typeof createSettingsApi>;
