import pino from 'pino';

/**
 * Logger centralizado
 * Desabilita pino-pretty em modo sidecar (evita worker threads)
 */
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const isSidecar = process.env.SIDECAR_MODE === '1';
const usePretty = isDev && !isSidecar;

// Cria logger com fallback caso pino-pretty não funcione
let loggerInstance: pino.Logger;

try {
  loggerInstance = pino(
    usePretty
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
      : {
          level: isDev ? 'debug' : 'info',
        },
  );
} catch (error) {
  // Fallback se pino-pretty falhar (sidecar mode)
  loggerInstance = pino({
    level: isDev ? 'debug' : 'info',
  });
}

export const logger = loggerInstance;
