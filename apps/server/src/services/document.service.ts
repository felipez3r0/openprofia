import type {
  IJob,
  IUploadDocumentResponse,
  JobStatus,
} from '@openprofia/core';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { defaultConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';
import db from '../db/connection.js';
import { enqueueJob } from '../worker/queue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Service de gerenciamento de documentos
 */
export class DocumentService {
  private uploadsPath: string;

  constructor() {
    const storagePath = path.resolve(
      __dirname,
      '../..',
      defaultConfig.STORAGE_PATH,
    );
    this.uploadsPath = path.join(storagePath, 'uploads');
    this.ensureUploadsDirectory();
  }

  /**
   * Cria um job de upload de documento
   */
  async uploadDocument(
    skillId: string,
    fileBuffer: Buffer,
    filename: string,
  ): Promise<IUploadDocumentResponse> {
    const jobId = randomUUID();
    const sanitizedFilename = this.sanitizeFilename(filename);
    const filePath = path.join(
      this.uploadsPath,
      `${jobId}_${sanitizedFilename}`,
    );

    // Salva arquivo
    writeFileSync(filePath, fileBuffer);

    // Cria job no banco
    const job: Partial<IJob> = {
      id: jobId,
      skillId,
      filePath,
      fileName: sanitizedFilename,
      status: 'pending' as JobStatus,
      progress: 0,
    };

    enqueueJob(job as IJob);

    logger.info(
      {
        jobId,
        skillId,
        filename: sanitizedFilename,
        size: fileBuffer.length,
      },
      'Document uploaded',
    );

    return {
      jobId,
      status: 'pending' as JobStatus,
    };
  }

  /**
   * Obtém o status de um job
   */
  getJobStatus(jobId: string): IJob {
    const stmt = db.prepare('SELECT * FROM jobs WHERE id = ?');
    const row = stmt.get(jobId);

    if (!row) {
      throw new NotFoundError('Job', jobId);
    }

    return {
      id: row.id,
      skillId: row.skill_id,
      filePath: row.file_path,
      fileName: row.file_name,
      status: row.status as JobStatus,
      error: row.error,
      progress: row.progress,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    };
  }

  /**
   * Lista jobs de uma skill
   */
  listJobs(skillId: string, status?: JobStatus): IJob[] {
    let query = 'SELECT * FROM jobs WHERE skill_id = ?';
    const params: any[] = [skillId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);

    return rows.map((row: any) => ({
      id: row.id,
      skillId: row.skill_id,
      filePath: row.file_path,
      fileName: row.file_name,
      status: row.status as JobStatus,
      error: row.error,
      progress: row.progress,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    }));
  }

  /**
   * Sanitiza nome de arquivo removendo caracteres perigosos
   */
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  /**
   * Garante que o diretório de uploads existe
   */
  private ensureUploadsDirectory(): void {
    if (!existsSync(this.uploadsPath)) {
      mkdirSync(this.uploadsPath, { recursive: true });
      logger.info({ path: this.uploadsPath }, 'Created uploads directory');
    }
  }
}

// Exporta instância singleton
export const documentService = new DocumentService();
