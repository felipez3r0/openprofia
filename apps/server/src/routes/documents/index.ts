import type { FastifyPluginAsync } from 'fastify';
import { documentService } from '../../services/document.service.js';
import {
  uploadResponseSchema,
  jobStatusSchema,
  jobsListSchema,
} from './schema.js';

/**
 * Documents routes
 */
const documentsRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /documents/upload - Upload de documento
   */
  fastify.post(
    '/upload',
    {
      schema: {
        description: 'Upload a document for processing',
        tags: ['documents'],
        consumes: ['multipart/form-data'],
        response: {
          201: uploadResponseSchema,
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      // Lê o buffer primeiro para garantir que todos os fields do multipart sejam parseados
      const buffer = await data.toBuffer();

      // Extrai skillId dos fields do multipart
      const skillId = (data.fields as Record<string, { value: string }>)
        ?.skillId?.value;

      if (!skillId) {
        return reply.code(400).send({ error: 'skillId is required' });
      }

      // Cria o job
      const result = await documentService.uploadDocument(
        skillId,
        buffer,
        data.filename,
      );

      return reply.code(201).send(result);
    },
  );

  /**
   * GET /documents/:jobId/status - Status de um job
   */
  fastify.get<{ Params: { jobId: string } }>(
    '/:jobId/status',
    {
      schema: {
        description: 'Get job status',
        tags: ['documents'],
        params: {
          type: 'object',
          properties: {
            jobId: { type: 'string' },
          },
          required: ['jobId'],
        },
        response: {
          200: jobStatusSchema,
        },
      },
    },
    async (request, reply) => {
      const job = documentService.getJobStatus(request.params.jobId);
      return job;
    },
  );

  /**
   * GET /documents/jobs/:skillId - Lista jobs de uma skill
   */
  fastify.get<{
    Params: { skillId: string };
    Querystring: { status?: string };
  }>(
    '/jobs/:skillId',
    {
      schema: {
        description: 'List jobs for a skill',
        tags: ['documents'],
        params: {
          type: 'object',
          properties: {
            skillId: { type: 'string' },
          },
          required: ['skillId'],
        },
        querystring: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed'],
            },
          },
        },
        response: {
          200: jobsListSchema,
        },
      },
    },
    async (request, reply) => {
      const jobs = documentService.listJobs(
        request.params.skillId,
        request.query.status as any,
      );
      return jobs;
    },
  );
};

export default documentsRoutes;
