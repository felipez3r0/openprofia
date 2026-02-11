import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { defaultConfig } from '../config/env.js';

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  // JWT apenas se houver secret configurado (modo universitário)
  if (defaultConfig.JWT_SECRET) {
    await fastify.register(import('@fastify/jwt'), {
      secret: defaultConfig.JWT_SECRET,
    });

    fastify.log.info('JWT authentication enabled');
  } else {
    fastify.log.info('JWT authentication disabled (local mode)');
  }
};

export default fp(jwtPlugin);
