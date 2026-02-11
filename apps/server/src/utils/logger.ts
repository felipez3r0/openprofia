import pino from 'pino';
import { defaultConfig } from '../config/env.js';

/**
 * Logger centralizado
 */
export const logger = pino({
  level: defaultConfig.NODE_ENV === 'development' ? 'debug' : 'info',
  transport:
    defaultConfig.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            colorize: true,
          },
        }
      : undefined,
});
