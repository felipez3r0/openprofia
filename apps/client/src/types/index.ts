export type {
  IApiResponse,
  IPaginatedResponse,
  IErrorResponse,
  ISettingsMap,
  IChatMessage,
  IChatRequest,
  IChatResponse,
  IChatStreamChunk,
  ISkillManifest,
  ISkill,
  ICreateSkillRequest,
  ICreateSkillResponse,
  IJob,
  IUploadDocumentRequest,
  IUploadDocumentResponse,
  IDocumentChunk,
  ISearchResult,
  ISearchParams,
} from '@openprofia/core';

export { JobStatus } from '@openprofia/core';

export type ConnectionMode = 'local' | 'remote';
