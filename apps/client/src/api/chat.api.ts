import type { IChatRequest, IChatResponse, IChatStreamChunk } from '@/types';
import type { ApiClient } from './client';

export function createChatApi(client: ApiClient) {
  return {
    async send(request: IChatRequest): Promise<IChatResponse> {
      const response = await client.post<IChatResponse>('/chat', request);
      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Chat request failed');
      }
      return response.data;
    },

    async *stream(
      request: IChatRequest,
      signal?: AbortSignal,
    ): AsyncGenerator<IChatStreamChunk> {
      const body = await client.postStream('/chat/stream', request, signal);
      const decoder = new TextDecoderStream();
      const reader = body
        .pipeThrough(decoder as ReadableWritablePair<string, Uint8Array>)
        .getReader();

      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') return;
            const chunk = JSON.parse(data) as IChatStreamChunk;
            yield chunk;
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
}

export type ChatApi = ReturnType<typeof createChatApi>;
