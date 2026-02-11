import { Header } from '@/components/layout/header';
import { ChatWindow } from '@/components/chat/chat-window';
import { ChatInput } from '@/components/chat/chat-input';

export function ChatPage() {
  return (
    <>
      <Header />
      <ChatWindow />
      <ChatInput />
    </>
  );
}
