import type {
  IChatRequest,
  IChatResponse,
  IChatMessage,
  ISkillManifest,
} from '@openprofia/core';
import { ollamaService } from './ollama.service.js';
import { settingsService } from './settings.service.js';
import { searchChunks } from '../rag/search.js';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';
import db from '../db/connection.js';
import type { SkillRow } from '../db/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Service de Chat - orquestra RAG + LLM
 */
export class ChatService {
  /**
   * Processa um request de chat
   */
  async chat(request: IChatRequest): Promise<IChatResponse> {
    const { skillId, messages, temperature = 0.7, maxTokens } = request;

    // Valida que a skill existe
    const skill = this.getSkill(skillId);
    if (!skill) {
      throw new NotFoundError('Skill', skillId);
    }

    // Carrega o system prompt da skill
    const systemPrompt = this.loadSystemPrompt(skillId);

    // Busca contexto RAG relevante (se a skill tiver knowledge)
    let contextChunks: string[] = [];
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();

    if (lastUserMessage && skill.hasKnowledge) {
      const results = await searchChunks({
        skillId,
        query: lastUserMessage.content,
        limit: defaultConfig.MAX_CONTEXT_CHUNKS,
      });

      contextChunks = results.map((r) => r.chunk.content);
    }

    // Monta as mensagens finais
    const finalMessages = this.buildMessages(
      systemPrompt,
      contextChunks,
      messages,
    );

    // Chama Ollama
    const model =
      skill.manifest.modelPreferences?.chat ||
      settingsService.get('ollama_chat_model');
    const response = await ollamaService.chat({
      model,
      messages: finalMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      options: {
        temperature,
        num_predict: maxTokens,
      },
    });

    logger.info(
      {
        skillId,
        model,
        messagesCount: messages.length,
        contextChunks: contextChunks.length,
      },
      'Chat completed',
    );

    return {
      message: {
        role: response.message.role as 'assistant',
        content: response.message.content,
        timestamp: new Date().toISOString(),
      },
      model: response.model,
      contextUsed:
        contextChunks.length > 0
          ? {
              chunks: contextChunks.length,
              sources: [], // TODO: extrair sources dos metadados
            }
          : undefined,
    };
  }

  /**
   * Processa chat com streaming
   */
  async *chatStream(
    request: IChatRequest,
  ): AsyncGenerator<string, void, unknown> {
    const { skillId, messages, temperature = 0.7, maxTokens } = request;

    const skill = this.getSkill(skillId);
    if (!skill) {
      throw new NotFoundError('Skill', skillId);
    }

    const systemPrompt = this.loadSystemPrompt(skillId);

    let contextChunks: string[] = [];
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();

    if (lastUserMessage && skill.hasKnowledge) {
      const results = await searchChunks({
        skillId,
        query: lastUserMessage.content,
        limit: defaultConfig.MAX_CONTEXT_CHUNKS,
      });

      contextChunks = results.map((r) => r.chunk.content);
    }

    const finalMessages = this.buildMessages(
      systemPrompt,
      contextChunks,
      messages,
    );

    const model =
      skill.manifest.modelPreferences?.chat ||
      settingsService.get('ollama_chat_model');

    for await (const chunk of ollamaService.chatStream({
      model,
      messages: finalMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      options: {
        temperature,
        num_predict: maxTokens,
      },
    })) {
      yield chunk;
    }

    logger.info(
      { skillId, model, contextChunks: contextChunks.length },
      'Chat stream completed',
    );
  }

  /**
   * Monta as mensagens finais incluindo system prompt e contexto RAG
   */
  private buildMessages(
    systemPrompt: string,
    contextChunks: string[],
    userMessages: IChatMessage[],
  ): IChatMessage[] {
    const messages: IChatMessage[] = [];

    // System prompt base
    let systemContent = systemPrompt;

    // Adiciona contexto RAG ao system prompt se houver
    if (contextChunks.length > 0) {
      const context = contextChunks
        .map((chunk, i) => `[Fragmento ${i + 1}]\n${chunk}`)
        .join('\n\n');

      systemContent += `\n\n# Contexto Relevante\n\nUse as seguintes informações para responder:\n\n${context}`;
    }

    messages.push({
      role: 'system',
      content: systemContent,
    });

    // Adiciona mensagens do usuário
    messages.push(...userMessages);

    return messages;
  }

  /**
   * Carrega o system prompt de uma skill
   */
  private loadSystemPrompt(skillId: string): string {
    const skillsPath = path.resolve(
      __dirname,
      '../..',
      defaultConfig.SKILLS_PATH,
    );
    const promptPath = path.join(skillsPath, skillId, 'prompt.md');

    if (!existsSync(promptPath)) {
      logger.warn(
        { skillId, promptPath },
        'Skill prompt.md not found, using default',
      );
      return 'Você é um assistente prestativo.';
    }

    return readFileSync(promptPath, 'utf-8');
  }

  /**
   * Obtém informações de uma skill do banco
   */
  private getSkill(
    skillId: string,
  ): {
    id: string;
    name: string;
    version: string;
    manifest: ISkillManifest;
    path: string;
    hasKnowledge: boolean;
    installedAt: string;
  } | null {
    const stmt = db.prepare('SELECT * FROM skills WHERE id = ?');
    const skill = stmt.get(skillId) as SkillRow | undefined;

    if (!skill) {
      return null;
    }

    return {
      id: skill.id,
      name: skill.name,
      version: skill.version,
      manifest: JSON.parse(skill.manifest) as ISkillManifest,
      path: skill.path,
      hasKnowledge: Boolean(skill.has_knowledge),
      installedAt: skill.installed_at,
    };
  }
}

// Exporta instância singleton
export const chatService = new ChatService();
