import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/stores/chat.store';
import { MessageBubble } from './message-bubble';
import { StreamingText } from './streaming-text';

export function ChatWindow() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Inicie uma conversa
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Envie uma mensagem para começar a interagir com a IA.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        {isStreaming && streamingContent && (
          <StreamingText content={streamingContent} />
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
