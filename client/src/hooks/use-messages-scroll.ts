import { useState, useEffect, RefObject } from 'react';

interface UseMessagesScrollOptions {
  messageEndRef: RefObject<HTMLElement>;
  messagesContainerRef: RefObject<HTMLElement>;
  messagesLength: number;
}

interface UseMessagesScrollResult {
  hasNewMessages: boolean;
  newMessageCount: number;
  scrollToLatestMessage: () => void;
  isAtBottom: boolean;
  handleScroll: () => void;
}

/**
 * Hook para gerenciar o comportamento de rolagem das mensagens
 * e notificação de novas mensagens
 */
export function useMessagesScroll({
  messageEndRef,
  messagesContainerRef,
  messagesLength
}: UseMessagesScrollOptions): UseMessagesScrollResult {
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [prevMessagesLength, setPrevMessagesLength] = useState(messagesLength);

  // Detectar se o usuário está no final da conversa
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isScrolledToBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 30;
    
    setIsAtBottom(isScrolledToBottom);
    
    // Se estiver no final, resetar contador de novas mensagens
    if (isScrolledToBottom) {
      setNewMessageCount(0);
      setHasNewMessages(false);
    }
  };
  
  // Monitorar novas mensagens
  useEffect(() => {
    // Ignora a primeira renderização (quando length === prevLength)
    if (messagesLength === prevMessagesLength) return;
    
    // Quando chegam novas mensagens
    if (messagesLength > prevMessagesLength) {
      // Verifica se estamos no final da conversa
      if (!isAtBottom) {
        // Se não estamos no final, mostra indicador de novas mensagens
        setHasNewMessages(true);
        setNewMessageCount(prev => prev + 1);
      } else if (messageEndRef.current) {
        // Se estamos no final, faz scroll suave
        messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        setNewMessageCount(0);
      }
    }
    
    // Atualiza o comprimento anterior
    setPrevMessagesLength(messagesLength);
  }, [messagesLength, prevMessagesLength, isAtBottom, messageEndRef]);
  
  // Função para rolar para a última mensagem
  const scrollToLatestMessage = () => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setHasNewMessages(false);
      setNewMessageCount(0);
      setIsAtBottom(true);
    }
  };

  return {
    hasNewMessages,
    newMessageCount,
    scrollToLatestMessage,
    isAtBottom,
    handleScroll
  };
}