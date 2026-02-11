import type { FastifyPluginAsync } from 'fastify';
import type { IChatRequest } from '@openprofia/core';
import { chatService } from '../../services/chat.service.js';
import {
  chatRequestSchema,
  chatResponseSchema,
  chatStreamEventSchema,
} from './schema.js';

/**
 * Chat routes
 */
const chatRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /chat - Chat não-streaming
   */
  fastify.post<{ Body: IChatRequest }>(
    '/',
    {
      schema: {
        description: 'Send a chat message',
        tags: ['chat'],
        body: chatRequestSchema,
        response: {
          200: chatResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const response = await chatService.chat(request.body);
      return response;
    },
  );

  /**
   * POST /chat/stream - Chat com streaming (SSE)
   */
  fastify.post<{ Body: IChatRequest }>(
    '/stream',
    {
      schema: {
        description:
          'Send a chat message with streaming response (Server-Sent Events)',
        tags: ['chat'],
        body: chatRequestSchema,
        response: {
          '2xx': {
            type: 'object',
            description: 'Streaming response with SSE format',
          },
        },
      },
    },
    async (request, reply) => {
      // Transfere headers já definidos pelo Fastify (inclui CORS) para reply.raw
      const headers = reply.getHeaders();
      for (const [key, value] of Object.entries(headers)) {
        if (value !== undefined) {
          reply.raw.setHeader(key, value as string);
        }
      }

      // Configura headers para SSE
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');

      try {
        for await (const chunk of chatService.chatStream(request.body)) {
          // Envia chunk no formato SSE
          reply.raw.write(
            `data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`,
          );
        }

        // Envia evento de conclusão
        reply.raw.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      } catch (error: any) {
        // Envia erro
        reply.raw.write(
          `data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`,
        );
      } finally {
        reply.raw.end();
      }
    },
  );
};

export default chatRoutes;
