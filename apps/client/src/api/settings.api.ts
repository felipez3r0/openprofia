import type { ISettingsMap, IModelPullProgress } from '@/types';
import type { ApiClient } from './client';
import { API_PREFIX } from '@/config/constants';

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
      console.log(
        '[SettingsAPI] Requesting Ollama models:',
        `/settings/ollama/models${query}`,
      );
      const response = await client.get<string[]>(
        `/settings/ollama/models${query}`,
      );
      console.log('[SettingsAPI] Ollama models response:', response);
      if (!response.success || !response.data) {
        const error = response.error ?? 'Failed to list Ollama models';
        console.error('[SettingsAPI] Failed to list models:', error);
        throw new Error(error);
      }
      return response.data;
    },

    pullModel(
      baseUrl: string,
      model: string,
      onProgress: (progress: IModelPullProgress) => void,
      onDone: () => void,
      onError: (error: string) => void,
    ): AbortController {
      const controller = new AbortController();
      const url = `${baseUrl}${API_PREFIX}/settings/ollama/pull`;

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok || !response.body) {
            onError(`Failed to pull model: ${response.statusText}`);
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk
              .split('\n')
              .filter((l) => l.startsWith('data: '));

            for (const line of lines) {
              try {
                const data = JSON.parse(line.slice(6)) as IModelPullProgress & {
                  error?: string;
                };
                if (data.error) {
                  onError(data.error);
                  return;
                }
                onProgress(data);
                if (data.done) {
                  onDone();
                  return;
                }
              } catch {
                // ignore malformed lines
              }
            }
          }
        })
        .catch((err) => {
          if ((err as Error).name !== 'AbortError') {
            onError((err as Error).message);
          }
        });

      return controller;
    },
  };
}

export type SettingsApi = ReturnType<typeof createSettingsApi>;
