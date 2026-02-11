import type { FastifyPluginAsync } from 'fastify';
import { skillService } from '../../services/skill.service.js';
import {
  skillResponseSchema,
  skillsListResponseSchema,
  createSkillResponseSchema,
} from './schema.js';

/**
 * Skills routes
 */
const skillsRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /skills - Lista todas as skills
   */
  fastify.get(
    '/',
    {
      schema: {
        description: 'List all installed skills',
        tags: ['skills'],
        response: {
          200: skillsListResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const skills = skillService.listSkills();
      return skills;
    },
  );

  /**
   * GET /skills/:id - Obtém uma skill específica
   */
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        description: 'Get a specific skill',
        tags: ['skills'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: skillResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const skill = skillService.getSkill(request.params.id);
      if (!skill) {
        return reply.code(404).send({ error: 'Skill not found' });
      }
      return skill;
    },
  );

  /**
   * POST /skills - Upload e instala uma nova skill (.zip)
   */
  fastify.post(
    '/',
    {
      schema: {
        description: 'Upload and install a new skill from .zip file',
        tags: ['skills'],
        consumes: ['multipart/form-data'],
        response: {
          201: createSkillResponseSchema,
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

      // Valida que é um .zip
      if (!data.filename.endsWith('.zip')) {
        return reply.code(400).send({ error: 'File must be a .zip archive' });
      }

      // Lê o buffer do arquivo
      const buffer = await data.toBuffer();

      // Instala a skill
      const skill = await skillService.installSkill(buffer, data.filename);

      return reply.code(201).send({
        skillId: skill.id,
        name: skill.manifest.name,
        version: skill.manifest.version,
      });
    },
  );

  /**
   * DELETE /skills/:id - Remove uma skill
   */
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        description: 'Uninstall a skill',
        tags: ['skills'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          204: {
            type: 'null',
            description: 'Skill successfully uninstalled',
          },
        },
      },
    },
    async (request, reply) => {
      await skillService.uninstallSkill(request.params.id);
      return reply.code(204).send();
    },
  );
};

export default skillsRoutes;
