import { create } from 'zustand';
import type { IChatMessage } from '@/types';

interface ChatState {
  messages: IChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  addMessage: (message: IChatMessage) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (token: string) => void;
  commitStreamingMessage: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setStreamingContent: (streamingContent) => set({ streamingContent }),
  appendStreamingContent: (token) =>
    set((state) => ({ streamingContent: state.streamingContent + token })),
  commitStreamingMessage: () => {
    const { streamingContent } = get();
    if (streamingContent) {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            role: 'assistant' as const,
            content: streamingContent,
            timestamp: new Date().toISOString(),
          },
        ],
        streamingContent: '',
        isStreaming: false,
      }));
    }
  },
  clearMessages: () =>
    set({ messages: [], streamingContent: '', isStreaming: false }),
}));
