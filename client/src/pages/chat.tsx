import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import SlackStyleChat from '@/components/chat/SlackStyleChat';
import FilteredChatList from '@/components/chat/FilteredChatList';
import NewFilteredChatList from '@/components/chat/NewFilteredChatList';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import '../styles/chat-fullscreen.css';

// Flag para controlar se deve usar o novo componente de chat filtrável
const USE_NEW_CHAT = true;

export default function ChatPage() {
  const [initialRoomId, setInitialRoomId] = useState<number | undefined>(undefined);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Esconder a barra lateral e header quando estiver na página de chat
  useEffect(() => {
    // Adicionar classe ao body para fazer estilizações globais
    document.body.classList.add('chat-fullscreen');
    
    // Cleanup ao desmontar
    return () => {
      document.body.classList.remove('chat-fullscreen');
      document.body.classList.remove('chat-fullscreen-active');
    };
  }, []);

  useEffect(() => {
    // Verificar se há um ID de sala nos parâmetros da URL
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId');
    if (roomId) {
      setInitialRoomId(parseInt(roomId));
    }
  }, []);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (user === null) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Adiciona a classe específica para comportamento de rolagem
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    
    // Limpar ao desmontar
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div className="chat-page">
      {USE_NEW_CHAT ? (
        <NewFilteredChatList initialRoomId={initialRoomId} />
      ) : (
        <SlackStyleChat initialRoomId={initialRoomId} />
      )}
    </div>
  );
}