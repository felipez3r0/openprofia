import type { IJob } from '@openprofia/core';
import db from '../db/connection.js';
import { logger } from '../utils/logger.js';
import type { JobRow, QueueStatsRow } from '../db/types.js';

/**
 * Adiciona um job na fila (SQLite)
 */
export function enqueueJob(job: IJob): void {
  const stmt = db.prepare(`
    INSERT INTO jobs (id, skill_id, file_path, file_name, status, progress, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  stmt.run(
    job.id,
    job.skillId,
    job.filePath,
    job.fileName,
    job.status,
    job.progress || 0,
  );

  logger.info({ jobId: job.id, skillId: job.skillId }, 'Job enqueued');
}

/**
 * Obtém o próximo job pendente e marca como 'processing'
 * Retorna null se não houver jobs pendentes
 */
export function dequeueJob(): IJob | null {
  // Transação para evitar race conditions
  const getStmt = db.prepare(`
    SELECT * FROM jobs 
    WHERE status = 'pending' 
    ORDER BY created_at ASC 
    LIMIT 1
  `);

  const updateStmt = db.prepare(`
    UPDATE jobs 
    SET status = 'processing', 
        started_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `);

  const transaction = db.transaction(() => {
    const row = getStmt.get() as JobRow | undefined;

    if (!row) {
      return null;
    }

    updateStmt.run(row.id);

    return {
      id: row.id,
      skillId: row.skill_id,
      filePath: row.file_path,
      fileName: row.file_name,
      status: 'processing',
      progress: row.progress,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      startedAt: row.started_at ?? undefined,
    } as IJob;
  });

  const job = transaction();

  if (job) {
    logger.info({ jobId: job.id }, 'Job dequeued');
  }

  return job;
}

/**
 * Marca um job como concluído
 */
export function completeJob(jobId: string, progress: number = 100): void {
  const stmt = db.prepare(`
    UPDATE jobs 
    SET status = 'completed',
        progress = ?,
        completed_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(progress, jobId);

  logger.info({ jobId }, 'Job completed');
}

/**
 * Marca um job como falho
 */
export function failJob(jobId: string, error: string): void {
  const stmt = db.prepare(`
    UPDATE jobs 
    SET status = 'failed',
        error = ?,
        completed_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(error, jobId);

  logger.error({ jobId, error }, 'Job failed');
}

/**
 * Atualiza o progresso de um job
 */
export function updateJobProgress(jobId: string, progress: number): void {
  const stmt = db.prepare(`
    UPDATE jobs 
    SET progress = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(progress, jobId);
}

/**
 * Retorna contagem de jobs por status
 */
export function getQueueStats(): Record<string, number> {
  const stmt = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM jobs
    GROUP BY status
  `);

  const rows = stmt.all() as QueueStatsRow[];
  const stats: Record<string, number> = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };

  for (const row of rows) {
    stats[row.status] = row.count;
  }

  return stats;
}
