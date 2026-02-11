/**
 * Resposta padrão da API
 */
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Resposta paginada
 */
export interface IPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Resposta de erro padronizada
 */
export interface IErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Configurações do sistema (key-value persistido no SQLite)
 */
export interface ISettingsMap {
  ollama_base_url?: string;
  ollama_chat_model?: string;
  ollama_embedding_model?: string;
}

/**
 * Chaves válidas de settings
 */
export type SettingsKey = keyof ISettingsMap;
