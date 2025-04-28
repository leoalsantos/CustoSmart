import SocketIOChat from '@/components/chat/SocketIOChat';
import { PageTitle } from '@/components/ui/page-title';

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col">
      <PageTitle 
        title="Chat Interno" 
        subtitle="Sistema de mensagens e canais de comunicação"
      />
      
      <div className="flex-1">
        <SocketIOChat />
      </div>
    </div>
  );
}