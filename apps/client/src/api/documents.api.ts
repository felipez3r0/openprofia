import type { IUploadDocumentResponse, IJob } from '@/types';
import type { ApiClient } from './client';

export function createDocumentsApi(client: ApiClient) {
  return {
    async upload(
      skillId: string,
      file: File,
    ): Promise<IUploadDocumentResponse> {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('skillId', skillId);
      const response = await client.postFormData<IUploadDocumentResponse>(
        '/documents/upload',
        formData,
      );
      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to upload document');
      }
      return response.data;
    },

    async getJobStatus(jobId: string): Promise<IJob> {
      const response = await client.get<IJob>(
        `/documents/${encodeURIComponent(jobId)}/status`,
      );
      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to get job status');
      }
      return response.data;
    },

    async listJobs(skillId: string, status?: string): Promise<IJob[]> {
      const params = status ? `?status=${encodeURIComponent(status)}` : '';
      const response = await client.get<IJob[]>(
        `/documents/jobs/${encodeURIComponent(skillId)}${params}`,
      );
      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to list jobs');
      }
      return response.data;
    },
  };
}

export type DocumentsApi = ReturnType<typeof createDocumentsApi>;
