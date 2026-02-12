import type { FastifyPluginAsync } from 'fastify';
import { S } from 'fluent-json-schema';
import { ollamaService } from '../../services/ollama.service.js';

const healthResponseSchema = S.object()
  .prop('status', S.string().enum(['ok', 'degraded']).required())
  .prop('timestamp', S.string().format('date-time').required());

const detailedHealthResponseSchema = S.object()
  .prop('status', S.string().enum(['ok', 'degraded']).required())
  .prop('timestamp', S.string().format('date-time').required())
  .prop(
    'services',
    S.object()
      .prop('ollama', S.string().enum(['ok', 'unavailable']))
      .prop('database', S.string().enum(['ok', 'unavailable']))
      .prop('lancedb', S.string().enum(['ok', 'unavailable']))
      .required(['ollama', 'database', 'lancedb']),
  );

/**
 * Health check routes
 */
const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // Health check básico
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Basic health check',
        tags: ['health'],
        response: {
          200: healthResponseSchema,
        },
      },
    },
    async (_request, _reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    },
  );

  // Health check detalhado
  fastify.get(
    '/health/detailed',
    {
      schema: {
        description: 'Detailed health check with service status',
        tags: ['health'],
        response: {
          200: detailedHealthResponseSchema,
        },
      },
    },
    async (_request, _reply) => {
      fastify.log.debug('Health check detailed called');
      const ollamaHealthy = await ollamaService.healthCheck();
      fastify.log.debug({ ollamaHealthy }, 'Ollama health check result');

      return {
        status: ollamaHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          ollama: ollamaHealthy ? 'ok' : 'unavailable',
          database: 'ok', // Se chegou aqui, SQLite está ok
          lancedb: 'ok', // LanceDB é baseado em arquivo, sempre disponível
        },
      };
    },
  );
};

export default healthRoutes;
