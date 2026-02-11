import type { FastifyPluginAsync } from 'fastify';

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  // Swagger para documentação automática da API
  await fastify.register(import('@fastify/swagger'), {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'OpenProfIA API',
        description: 'API para plataforma de IA local-first para educação',
        version: '0.1.0',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'health', description: 'Health check endpoints' },
        { name: 'chat', description: 'Chat endpoints' },
        { name: 'skills', description: 'Skills management endpoints' },
        {
          name: 'documents',
          description: 'Document upload and processing endpoints',
        },
      ],
    },
  });

  // Swagger UI
  await fastify.register(import('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  fastify.log.info('Swagger documentation available at /docs');
};

export default swaggerPlugin;
