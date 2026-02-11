import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import { Send, StopCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useSkillStore } from '@/stores/skill.store';

export function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { send, cancel, isStreaming } = useChatStream();
  const activeSkillId = useSkillStore((s) => s.activeSkillId);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || !activeSkillId) return;
    setInput('');
    send(trimmed);
    textareaRef.current?.focus();
  }, [input, isStreaming, activeSkillId, send]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const disabled = !activeSkillId;

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto flex max-w-3xl gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? 'Selecione uma skill para começar...'
              : 'Digite sua mensagem... (Shift+Enter para nova linha)'
          }
          disabled={disabled}
          rows={1}
          className="min-h-[44px] max-h-[200px] resize-none"
        />
        {isStreaming ? (
          <Button
            variant="destructive"
            size="icon"
            onClick={cancel}
            aria-label="Parar geração"
          >
            <StopCircle className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            aria-label="Enviar mensagem"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
