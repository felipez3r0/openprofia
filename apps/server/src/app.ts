import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import type { AppError } from './utils/errors.js';

// Plugins
import corsPlugin from './plugins/cors.js';
import jwtPlugin from './plugins/jwt.js';
import swaggerPlugin from './plugins/swagger.js';
import multipartPlugin from '@fastify/multipart';

// Routes
import healthRoutes from './routes/health/index.js';
import chatRoutes from './routes/chat/index.js';
import skillsRoutes from './routes/skills/index.js';
import documentsRoutes from './routes/documents/index.js';
import settingsRoutes from './routes/settings/index.js';

/**
 * Cria e configura a aplicação Fastify
 */
export async function buildApp(
  opts: FastifyServerOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify(opts);

  // ========================================
  // Plugins
  // ========================================

  await app.register(corsPlugin);
  await app.register(jwtPlugin);
  await app.register(swaggerPlugin);
  await app.register(multipartPlugin, {
    limits: {
      fileSize: opts.bodyLimit || 50 * 1024 * 1024, // Default 50MB
    },
  });

  // ========================================
  // Error Handler
  // ========================================

  app.setErrorHandler((error: AppError | Error, request, reply) => {
    const statusCode = 'statusCode' in error ? error.statusCode : 500;
    const code = 'code' in error ? error.code : 'INTERNAL_ERROR';
    const details = 'details' in error ? error.details : undefined;

    app.log.error(
      {
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
      },
      'Request error',
    );

    reply.code(statusCode).send({
      statusCode,
      error: code,
      message: error.message,
      details,
    });
  });

  // ========================================
  // Routes
  // ========================================

  // Health check (sem prefixo)
  await app.register(healthRoutes);

  // API routes (com prefixo /api)
  await app.register(
    async (api) => {
      await api.register(chatRoutes, { prefix: '/chat' });
      await api.register(skillsRoutes, { prefix: '/skills' });
      await api.register(documentsRoutes, { prefix: '/documents' });
      await api.register(settingsRoutes, { prefix: '/settings' });
    },
    { prefix: '/api' },
  );

  // Root route
  app.get('/', async (_request, _reply) => {
    return {
      name: 'OpenProfIA API',
      version: '0.1.0',
      docs: '/docs',
      health: '/health',
    };
  });

  return app;
}
