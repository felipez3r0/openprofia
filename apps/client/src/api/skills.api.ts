import type { ISkill, ICreateSkillResponse, IModelCheckResult } from '@/types';
import type { ApiClient } from './client';

export function createSkillsApi(client: ApiClient) {
  return {
    async list(): Promise<ISkill[]> {
      const response = await client.get<ISkill[]>('/skills');
      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to fetch skills');
      }
      return response.data;
    },

    async getById(id: string): Promise<ISkill> {
      const response = await client.get<ISkill>(
        `/skills/${encodeURIComponent(id)}`,
      );
      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to fetch skill');
      }
      return response.data;
    },

    async upload(file: File): Promise<ICreateSkillResponse> {
      const formData = new FormData();
      formData.append('file', file);
      const response = await client.postFormData<ICreateSkillResponse>(
        '/skills',
        formData,
      );
      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to upload skill');
      }
      return response.data;
    },

    async checkModels(id: string): Promise<IModelCheckResult> {
      const response = await client.get<IModelCheckResult>(
        `/skills/${encodeURIComponent(id)}/check-models`,
      );
      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to check skill models');
      }
      return response.data;
    },

    async remove(id: string): Promise<void> {
      const response = await client.delete(`/skills/${encodeURIComponent(id)}`);
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to delete skill');
      }
    },
  };
}

export type SkillsApi = ReturnType<typeof createSkillsApi>;
