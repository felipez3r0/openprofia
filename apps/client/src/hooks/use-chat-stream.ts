import { useCallback, useRef } from 'react';
import { useApi } from '@/providers/connection-provider';
import { useChatStore } from '@/stores/chat.store';
import { useSkillStore } from '@/stores/skill.store';
import type { IChatMessage } from '@/types';

export function useChatStream() {
  const { chatApi } = useApi();
  const activeSkillId = useSkillStore((s) => s.activeSkillId);
  const {
    addMessage,
    setStreaming,
    setStreamingContent,
    appendStreamingContent,
    commitStreamingMessage,
    messages,
    isStreaming,
    streamingContent,
  } = useChatStore();
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (content: string) => {
      if (!activeSkillId || isStreaming) return;

      const userMessage: IChatMessage = {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      addMessage(userMessage);
      setStreaming(true);
      setStreamingContent('');

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const stream = chatApi.stream(
          {
            skillId: activeSkillId,
            messages: [...messages, userMessage],
            stream: true,
          },
          controller.signal,
        );

        for await (const chunk of stream) {
          if (chunk.type === 'token' && chunk.content) {
            appendStreamingContent(chunk.content);
          } else if (chunk.type === 'done') {
            commitStreamingMessage();
            return;
          } else if (chunk.type === 'error') {
            setStreaming(false);
            setStreamingContent('');
            addMessage({
              role: 'assistant',
              content: `Erro: ${chunk.error ?? 'Falha desconhecida'}`,
              timestamp: new Date().toISOString(),
            });
            return;
          }
        }

        // Fallback: se o stream terminou sem evento 'done'
        commitStreamingMessage();
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setStreaming(false);
          setStreamingContent('');
          addMessage({
            role: 'assistant',
            content: `Erro de conexão: ${(error as Error).message}`,
            timestamp: new Date().toISOString(),
          });
        }
      } finally {
        abortRef.current = null;
      }
    },
    [
      activeSkillId,
      isStreaming,
      messages,
      chatApi,
      addMessage,
      setStreaming,
      setStreamingContent,
      appendStreamingContent,
      commitStreamingMessage,
    ],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    commitStreamingMessage();
  }, [commitStreamingMessage]);

  return { send, cancel, isStreaming, streamingContent };
}
