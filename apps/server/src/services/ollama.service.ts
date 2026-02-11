import { defaultConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ExternalServiceError } from '../utils/errors.js';

/**
 * Request para chat com Ollama
 */
interface OllamaChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

/**
 * Response de chat do Ollama (não-streaming)
 */
interface OllamaChatResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

/**
 * Cliente para comunicação com Ollama API
 */
export class OllamaService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = defaultConfig.OLLAMA_BASE_URL;
  }

  /**
   * Envia request de chat para Ollama (não-streaming)
   */
  async chat(request: OllamaChatRequest): Promise<OllamaChatResponse> {
    const url = `${this.baseUrl}/api/chat`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          stream: false,
        }),
        signal: AbortSignal.timeout(120000), // 2min timeout
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      logger.debug(
        { model: request.model, messagesCount: request.messages.length },
        'Chat completed',
      );

      return data;
    } catch (error) {
      logger.error(
        { error, url, model: request.model },
        'Failed to chat with Ollama',
      );
      throw new ExternalServiceError('Ollama', `Failed to chat: ${error}`);
    }
  }

  /**
   * Envia request de chat para Ollama (streaming)
   * Retorna um AsyncGenerator que emite chunks de resposta
   */
  async *chatStream(
    request: OllamaChatRequest,
  ): AsyncGenerator<string, void, unknown> {
    const url = `${this.baseUrl}/api/chat`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          stream: true,
        }),
        signal: AbortSignal.timeout(120000),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${error}`);
      }

      if (!response.body) {
        throw new Error('No response body from Ollama');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              yield data.message.content;
            }
          } catch (e) {
            // Ignora linhas malformadas
            logger.debug({ line }, 'Failed to parse streaming chunk');
          }
        }
      }

      logger.debug({ model: request.model }, 'Chat stream completed');
    } catch (error) {
      logger.error(
        { error, url, model: request.model },
        'Failed to stream chat with Ollama',
      );
      throw new ExternalServiceError(
        'Ollama',
        `Failed to stream chat: ${error}`,
      );
    }
  }

  /**
   * Verifica se Ollama está disponível
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      logger.warn(
        { error, baseUrl: this.baseUrl },
        'Ollama health check failed',
      );
      return false;
    }
  }

  /**
   * Lista modelos disponíveis
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.status}`);
      }

      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      logger.error({ error }, 'Failed to list Ollama models');
      throw new ExternalServiceError(
        'Ollama',
        `Failed to list models: ${error}`,
      );
    }
  }
}

// Exporta instância singleton
export const ollamaService = new OllamaService();
