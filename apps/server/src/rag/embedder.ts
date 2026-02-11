import { defaultConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ExternalServiceError } from '../utils/errors.js';

/**
 * Resultado de embedding
 */
export interface EmbeddingResult {
  embedding: number[];
  model: string;
}

/**
 * Gera embedding de um texto usando Ollama
 */
export async function generateEmbedding(
  text: string,
): Promise<EmbeddingResult> {
  const url = `${defaultConfig.OLLAMA_BASE_URL}/api/embeddings`;
  const model = defaultConfig.OLLAMA_EMBEDDING_MODEL;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: text,
      }),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Invalid embedding response from Ollama');
    }

    logger.debug(
      { model, textLength: text.length, embeddingDim: data.embedding.length },
      'Generated embedding',
    );

    return {
      embedding: data.embedding,
      model,
    };
  } catch (error) {
    logger.error({ error, url, model }, 'Failed to generate embedding');
    throw new ExternalServiceError(
      'Ollama',
      `Failed to generate embedding: ${error}`,
    );
  }
}

/**
 * Gera embeddings para múltiplos textos em batch
 * NOTA: Ollama não suporta batch nativo, então fazemos sequencialmente
 * com um pequeno delay para evitar sobrecarregar o servidor
 */
export async function generateEmbeddings(
  texts: string[],
): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];

  for (let i = 0; i < texts.length; i++) {
    const result = await generateEmbedding(texts[i]);
    results.push(result);

    // Pequeno delay entre requests para não sobrecarregar
    if (i < texts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  logger.info({ count: texts.length }, 'Generated embeddings batch');

  return results;
}
