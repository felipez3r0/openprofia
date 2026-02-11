import type { ISearchParams, ISearchResult } from '@openprofia/core';
import { getChunksTable } from '../db/lance.js';
import { generateEmbedding } from './embedder.js';
import { defaultConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Busca semântica no LanceDB
 * Retorna os top-k chunks mais relevantes para a query
 */
export async function searchChunks(
  params: ISearchParams,
): Promise<ISearchResult[]> {
  const {
    skillId,
    query,
    limit = defaultConfig.MAX_CONTEXT_CHUNKS,
    threshold = 0.7,
  } = params;

  try {
    // Gera embedding da query
    const { embedding } = await generateEmbedding(query);

    // Obtém a tabela de chunks da skill
    const table = await getChunksTable(skillId);

    // Busca vetorial
    const results = await table.search(embedding).limit(limit).execute();

    // Filtra por threshold de similaridade
    const filtered = results
      .filter((result: any) => {
        // LanceDB retorna _distance (menor é melhor)
        // Convertemos para score (maior é melhor)
        const score = 1 / (1 + result._distance);
        return score >= threshold;
      })
      .map((result: any) => ({
        chunk: {
          id: result.id,
          skillId: result.skillId,
          documentId: result.documentId,
          content: result.content,
          embedding: result.embedding,
          metadata: result.metadata,
          createdAt: result.createdAt,
        },
        score: 1 / (1 + result._distance),
        distance: result._distance,
      }));

    logger.info(
      {
        skillId,
        queryLength: query.length,
        resultsCount: filtered.length,
        totalResults: results.length,
      },
      'Search completed',
    );

    return filtered;
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      logger.warn({ skillId }, 'No knowledge base found for skill');
      return [];
    }
    throw error;
  }
}

/**
 * Verifica se uma skill tem base de conhecimento
 */
export async function hasKnowledgeBase(skillId: string): Promise<boolean> {
  try {
    await getChunksTable(skillId);
    return true;
  } catch {
    return false;
  }
}
