import type { FastifyServerOptions } from 'fastify';

/**
 * Variáveis de ambiente do servidor
 */
export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  OLLAMA_BASE_URL: string;
  OLLAMA_EMBEDDING_MODEL: string;
  OLLAMA_CHAT_MODEL: string;
  JWT_SECRET?: string;
  STORAGE_PATH: string;
  SKILLS_PATH: string;
  WORKER_POLL_INTERVAL_MS: number;
  MAX_CONCURRENT_JOBS: number;
  CHUNK_SIZE: number;
  CHUNK_OVERLAP: number;
  MAX_CONTEXT_CHUNKS: number;
  MAX_FILE_SIZE_MB: number;
  SIDECAR_MODE: boolean;
  HOST: string;
}

/**
 * Detecta se está rodando em modo sidecar
 */
const isSidecarMode = process.env.SIDECAR_MODE === '1';

/**
 * Obtém o diretório de dados (OPENPROFIA_DATA_DIR em sidecar, relativo caso contrário)
 */
function getDataPath(defaultRelative: string): string {
  if (isSidecarMode && process.env.OPENPROFIA_DATA_DIR) {
    return process.env.OPENPROFIA_DATA_DIR;
  }
  return process.env.STORAGE_PATH || defaultRelative;
}

/**
 * Configuração padrão do servidor
 */
export const defaultConfig: EnvConfig = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  OLLAMA_EMBEDDING_MODEL:
    process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
  OLLAMA_CHAT_MODEL: process.env.OLLAMA_CHAT_MODEL || 'gemma2:2b',
  JWT_SECRET: process.env.JWT_SECRET,
  STORAGE_PATH: getDataPath('../../packages/storage'),
  SKILLS_PATH:
    process.env.SKILLS_PATH ||
    (isSidecarMode
      ? './skills' // Em sidecar, skills estão bundled junto com o server.js
      : '../../packages/skills'),
  WORKER_POLL_INTERVAL_MS: parseInt(
    process.env.WORKER_POLL_INTERVAL_MS || '5000',
    10,
  ),
  MAX_CONCURRENT_JOBS: parseInt(process.env.MAX_CONCURRENT_JOBS || '1', 10),
  CHUNK_SIZE: parseInt(process.env.CHUNK_SIZE || '500', 10),
  CHUNK_OVERLAP: parseInt(process.env.CHUNK_OVERLAP || '50', 10),
  MAX_CONTEXT_CHUNKS: parseInt(process.env.MAX_CONTEXT_CHUNKS || '5', 10),
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
  SIDECAR_MODE: isSidecarMode,
  HOST: isSidecarMode ? '127.0.0.1' : '0.0.0.0',
};

/**
 * Opções do Fastify baseadas no ambiente
 */
export function getFastifyOptions(): FastifyServerOptions {
  const isDev = defaultConfig.NODE_ENV === 'development';
  // Verifica se está em modo sidecar (SIDECAR_MODE=1)
  const isSidecar = process.env.SIDECAR_MODE === '1';

  // Em sidecar mode, usa logger simples (sem pino-pretty que usa worker threads)
  if (isSidecar) {
    return {
      logger: { level: isDev ? 'debug' : 'info' },
      bodyLimit: defaultConfig.MAX_FILE_SIZE_MB * 1024 * 1024,
      trustProxy: true,
    };
  }

  // Modo normal (não-sidecar)
  return {
    logger: isDev
      ? {
          level: 'debug',
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
              colorize: true,
            },
          },
        }
      : { level: 'info' },
    bodyLimit: defaultConfig.MAX_FILE_SIZE_MB * 1024 * 1024,
    trustProxy: true,
  };
}
