/**
 * Mensagem de chat
 */
export interface IChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

/**
 * Request de chat
 */
export interface IChatRequest {
  skillId: string;
  messages: IChatMessage[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Response de chat (não-streaming)
 */
export interface IChatResponse {
  message: IChatMessage;
  model: string;
  contextUsed?: {
    chunks: number;
    sources: string[];
  };
}

/**
 * Chunk de streaming (SSE)
 */
export interface IChatStreamChunk {
  type: 'token' | 'done' | 'error';
  content?: string;
  message?: IChatMessage;
  error?: string;
}
