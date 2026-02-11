import type { IJob } from '@openprofia/core';
import {
  dequeueJob,
  completeJob,
  failJob,
  updateJobProgress,
} from './queue.js';
import { extractText } from '../rag/extractor.js';
import { chunkText } from '../rag/chunker.js';
import { generateEmbeddings } from '../rag/embedder.js';
import {
  createChunksTable,
  getChunksTable,
  makeChunksArrowTable,
} from '../db/lance.js';
import { defaultConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';
import db from '../db/connection.js';

/**
 * Worker de processamento de documentos em background
 */
export class DocumentProcessor {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private processing = false;

  /**
   * Inicia o worker
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Document processor already running');
      return;
    }

    this.isRunning = true;
    logger.info(
      { pollInterval: defaultConfig.WORKER_POLL_INTERVAL_MS },
      'Document processor started',
    );

    // Poll a cada X ms
    this.intervalId = setInterval(() => {
      this.poll();
    }, defaultConfig.WORKER_POLL_INTERVAL_MS);
  }

  /**
   * Para o worker
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    logger.info('Document processor stopped');
  }

  /**
   * Verifica se há jobs pendentes e processa
   */
  private async poll(): Promise<void> {
    // Evita processamento concorrente
    if (this.processing) {
      return;
    }

    try {
      this.processing = true;

      // Busca próximo job
      const job = dequeueJob();

      if (!job) {
        // Nenhum job pendente
        return;
      }

      // Processa o job
      await this.processJob(job);
    } catch (error) {
      logger.error({ error }, 'Error in worker poll');
    } finally {
      this.processing = false;
    }
  }

  /**
   * Processa um job individual
   */
  private async processJob(job: IJob): Promise<void> {
    logger.info(
      { jobId: job.id, skillId: job.skillId, fileName: job.fileName },
      'Processing job',
    );

    try {
      // 1. Extrai texto do documento
      updateJobProgress(job.id, 10);
      const extracted = await extractText(job.filePath);

      logger.debug(
        {
          jobId: job.id,
          textLength: extracted.text.length,
          pages: extracted.pages,
        },
        'Text extracted',
      );

      // 2. Divide em chunks
      updateJobProgress(job.id, 30);
      const chunks = chunkText(extracted.text);

      logger.debug(
        { jobId: job.id, chunksCount: chunks.length },
        'Text chunked',
      );

      // 3. Gera embeddings
      updateJobProgress(job.id, 50);
      const embeddings = await generateEmbeddings(chunks.map((c) => c.content));

      logger.debug(
        { jobId: job.id, embeddingsCount: embeddings.length },
        'Embeddings generated',
      );

      // 4. Indexa no LanceDB
      updateJobProgress(job.id, 80);
      const now = new Date().toISOString();

      const data = chunks.map((chunk, i) => ({
        id: `${job.id}_chunk_${chunk.index}`,
        skillId: job.skillId,
        documentId: job.id,
        content: chunk.content,
        embedding: embeddings[i].embedding,
        metadata: JSON.stringify({
          source: job.fileName,
          chunkIndex: chunk.index,
          totalChunks: chunks.length,
          startChar: chunk.metadata.startChar,
          endChar: chunk.metadata.endChar,
        }),
        createdAt: now,
      }));

      // Tenta adicionar à tabela existente ou cria uma nova
      try {
        const table = await getChunksTable(job.skillId);
        await table.add(makeChunksArrowTable(data));
        logger.debug(
          { jobId: job.id, table: table.name },
          'Added to existing table',
        );
      } catch (error) {
        // Tabela não existe, cria uma nova
        await createChunksTable(job.skillId, data);
        logger.debug(
          { jobId: job.id, skillId: job.skillId },
          'Created new table',
        );
      }

      // 5. Atualiza has_knowledge da skill
      const updateSkillStmt = db.prepare(
        'UPDATE skills SET has_knowledge = 1 WHERE id = ?',
      );
      updateSkillStmt.run(job.skillId);

      // 6. Marca como concluído
      completeJob(job.id, 100);

      logger.info(
        {
          jobId: job.id,
          skillId: job.skillId,
          chunks: chunks.length,
        },
        'Job completed successfully',
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ jobId: job.id, error: message }, 'Job processing failed');
      failJob(job.id, message);
    }
  }
}

// Exporta instância singleton
export const documentProcessor = new DocumentProcessor();
