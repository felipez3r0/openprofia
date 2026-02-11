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
  IModelCheckResult,
  IModelPullProgress,
  IJob,
  IUploadDocumentRequest,
  IUploadDocumentResponse,
  IDocumentChunk,
  ISearchResult,
  ISearchParams,
} from '@openprofia/core';

export { JobStatus } from '@openprofia/core';

/**
 * Modo de conexão do client
 * - 'embedded': Server sidecar gerenciado pelo app (recomendado)
 * - 'local': Server local externo em localhost:3000
 * - 'remote': Server remoto (URL customizada)
 */
export type ConnectionMode = 'embedded' | 'local' | 'remote';
