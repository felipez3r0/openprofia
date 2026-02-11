/**
 * Status de um Job de processamento
 */
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Job de processamento de documento
 */
export interface IJob {
  id: string;
  skillId: string;
  filePath: string;
  fileName: string;
  status: JobStatus;
  error?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Request de upload de documento
 */
export interface IUploadDocumentRequest {
  skillId: string;
  file: Buffer;
  filename: string;
}

/**
 * Response de upload de documento
 */
export interface IUploadDocumentResponse {
  jobId: string;
  status: JobStatus;
}
