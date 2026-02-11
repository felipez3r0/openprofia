import type { FastifyPluginAsync } from 'fastify';

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(import('@fastify/cors'), {
    origin: true, // Permite todas as origens em dev (ajustar em produção)
    credentials: true,
  });
};

export default corsPlugin;
