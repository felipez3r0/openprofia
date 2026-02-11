import type { FastifyPluginAsync } from 'fastify';
import S from 'fluent-json-schema';
import { settingsService } from '../../services/settings.service.js';
import { ollamaService } from '../../services/ollama.service.js';
import { logger } from '../../utils/logger.js';

const settingsResponseSchema = S.object()
  .prop('ollama_base_url', S.string())
  .prop('ollama_chat_model', S.string())
  .prop('ollama_embedding_model', S.string());

const updateSettingsBodySchema = S.object()
  .prop('ollama_base_url', S.string().minLength(1))
  .prop('ollama_chat_model', S.string().minLength(1))
  .prop('ollama_embedding_model', S.string().minLength(1));

const modelsResponseSchema = S.object()
  .prop('success', S.boolean())
  .prop('data', S.array().items(S.string()));

/**
 * Rotas de configuração do sistema
 */
const settingsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/settings — retorna configurações atuais
  fastify.get(
    '/',
    {
      schema: {
        description: 'Get current settings',
        tags: ['settings'],
        response: {
          200: S.object()
            .prop('success', S.boolean())
            .prop('data', settingsResponseSchema),
        },
      },
    },
    async () => {
      return { success: true, data: settingsService.getAll() };
    },
  );

  // PUT /api/settings — atualiza configurações
  fastify.put(
    '/',
    {
      schema: {
        description: 'Update settings',
        tags: ['settings'],
        body: updateSettingsBodySchema,
        response: {
          200: S.object()
            .prop('success', S.boolean())
            .prop('data', settingsResponseSchema),
        },
      },
    },
    async (request) => {
      const body = request.body as Record<string, string>;

      // Atualiza settings no DB
      settingsService.update(body);

      // Se a URL do Ollama mudou, atualiza o service em runtime
      if (body.ollama_base_url) {
        ollamaService.updateBaseUrl(body.ollama_base_url.trim());
      }

      logger.info({ keys: Object.keys(body) }, 'Settings updated via API');
      return { success: true, data: settingsService.getAll() };
    },
  );

  // GET /api/settings/ollama/models — lista modelos disponíveis
  fastify.get(
    '/ollama/models',
    {
      schema: {
        description: 'List available Ollama models',
        tags: ['settings'],
        querystring: S.object().prop(
          'url',
          S.string().description(
            'Optional Ollama URL to test (uses configured URL if omitted)',
          ),
        ),
        response: {
          200: modelsResponseSchema,
        },
      },
    },
    async (request) => {
      const { url } = request.query as { url?: string };
      const models = await ollamaService.listModels(url);
      return { success: true, data: models };
    },
  );
};

export default settingsRoutes;
