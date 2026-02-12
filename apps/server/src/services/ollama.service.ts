import { defaultConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ExternalServiceError } from '../utils/errors.js';
import type { IModelCheckResult, IModelPullProgress } from '@openprofia/core';

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
   * Atualiza a base URL em runtime (chamado ao salvar settings)
   */
  updateBaseUrl(url: string): void {
    this.baseUrl = url;
    logger.info({ baseUrl: url }, 'Ollama base URL updated');
  }

  getBaseUrl(): string {
    return this.baseUrl;
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

      const data = (await response.json()) as OllamaChatResponse;

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
      logger.debug({ baseUrl: this.baseUrl }, 'Checking Ollama health...');
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      const isOk = response.ok;
      if (isOk) {
        logger.debug({ baseUrl: this.baseUrl }, 'Ollama is healthy');
      } else {
        logger.warn(
          { baseUrl: this.baseUrl, status: response.status },
          'Ollama returned non-OK status',
        );
      }
      return isOk;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.warn(
        { error: errorMessage, baseUrl: this.baseUrl },
        'Ollama health check failed - is Ollama running?',
      );
      return false;
    }
  }

  /**
   * Lista modelos disponíveis.
   * Aceita URL opcional para testar um endpoint diferente do configurado.
   */
  async listModels(url?: string): Promise<string[]> {
    const targetUrl = url?.trim() || this.baseUrl;
    try {
      const response = await fetch(`${targetUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.status}`);
      }

      const data = (await response.json()) as {
        models?: Array<{ name: string }>;
      };
      return data.models?.map((m) => m.name) || [];
    } catch (error) {
      logger.error({ error, targetUrl }, 'Failed to list Ollama models');
      throw new ExternalServiceError(
        'Ollama',
        `Failed to list models: ${error}`,
      );
    }
  }

  /**
   * Normaliza nome de modelo para comparação.
   * "gemma2:2b" === "gemma2:2b", "nomic-embed-text" === "nomic-embed-text:latest"
   */
  private normalizeModelName(name: string): string {
    return name.includes(':') ? name : `${name}:latest`;
  }

  /**
   * Verifica quais modelos de uma lista estão instalados no Ollama.
   */
  async checkModelsAvailable(models: string[]): Promise<IModelCheckResult> {
    const installedModels = await this.listModels();
    const installedNormalized = new Set(
      installedModels.map((m) => this.normalizeModelName(m)),
    );

    const available: string[] = [];
    const missing: string[] = [];

    for (const model of models) {
      if (installedNormalized.has(this.normalizeModelName(model))) {
        available.push(model);
      } else {
        missing.push(model);
      }
    }

    return { available, missing };
  }

  /**
   * Faz pull (download) de um modelo no Ollama.
   * Retorna AsyncGenerator com progresso de download (NDJSON do Ollama).
   */
  async *pullModel(
    model: string,
  ): AsyncGenerator<IModelPullProgress, void, unknown> {
    const url = `${this.baseUrl}/api/pull`;

    logger.info({ model }, 'Starting model pull from Ollama');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model, stream: true }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ExternalServiceError(
        'Ollama',
        `Failed to pull model "${model}": ${response.status} - ${errorText}`,
      );
    }

    if (!response.body) {
      throw new ExternalServiceError('Ollama', 'No response body from pull');
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
          const data = JSON.parse(line) as {
            status?: string;
            completed?: number;
            total?: number;
          };
          const completed = data.completed ?? 0;
          const total = data.total ?? 0;
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
          const isDone = data.status === 'success';

          yield {
            model,
            status: data.status ?? 'unknown',
            completed,
            total,
            percent,
            done: isDone,
          };
        } catch {
          logger.debug({ line }, 'Failed to parse pull progress chunk');
        }
      }
    }

    logger.info({ model }, 'Model pull completed');
  }
}

// Exporta instância singleton
export const ollamaService = new OllamaService();
