import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/hooks/use-chat';

export interface ChatMessagingState {
  messageInput: string;
  messageToReply: ChatMessage | null;
  showEmojiPicker: boolean;
  inChatSearchTerm: string;
  showChatSearch: boolean;
  searchResults: number[];
  currentSearchResultIndex: number;
  pendingAttachments: File[];
}

export function useChatMessaging(messages: ChatMessage[], onSendMessage: (text: string, replyToId?: number, attachments?: File[]) => void) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messageToReply, setMessageToReply] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [inChatSearchTerm, setInChatSearchTerm] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchResultIndex, setCurrentSearchResultIndex] = useState(-1);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);

  // Função para rolar para o final das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Efeito para rolar para o final quando as mensagens mudarem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Função para enviar uma mensagem
  const sendCurrentMessage = () => {
    if (messageInput.trim() || pendingAttachments.length > 0) {
      onSendMessage(
        messageInput.trim(), 
        messageToReply?.id, 
        pendingAttachments.length > 0 ? pendingAttachments : undefined
      );
      setMessageInput('');
      setMessageToReply(null);
      setShowEmojiPicker(false);
      setPendingAttachments([]);
    }
  };

  // Função para iniciar uma resposta a uma mensagem
  const replyToMessage = (message: ChatMessage) => {
    setMessageToReply(message);
  };

  // Função para cancelar a resposta a uma mensagem
  const cancelReply = () => {
    setMessageToReply(null);
  };

  // Função para lidar com pressionamento de teclas
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendCurrentMessage();
    }
  };

  // Função para abrir o seletor de arquivos
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  // Função para tratar o upload de arquivos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setPendingAttachments((prev) => [...prev, ...newFiles]);
    }
    // Limpar o valor do input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Função para remover um anexo pendente
  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Função para pesquisar nas mensagens
  const searchInMessages = () => {
    if (!inChatSearchTerm.trim()) {
      setSearchResults([]);
      setCurrentSearchResultIndex(-1);
      return;
    }

    const term = inChatSearchTerm.toLowerCase();
    const indices: number[] = [];

    messages.forEach((message, index) => {
      if (message.content.toLowerCase().includes(term)) {
        indices.push(index);
      }
    });

    setSearchResults(indices);
    setCurrentSearchResultIndex(indices.length > 0 ? 0 : -1);
  };

  // Efeito para atualizar os resultados da pesquisa quando o termo muda
  useEffect(() => {
    searchInMessages();
  }, [inChatSearchTerm, messages]);

  // Função para navegar para o próximo resultado da pesquisa
  const goToNextSearchResult = () => {
    if (searchResults.length === 0) return;
    
    setCurrentSearchResultIndex((prev) => {
      const next = (prev + 1) % searchResults.length;
      scrollToMessage(searchResults[next]);
      return next;
    });
  };

  // Função para navegar para o resultado anterior da pesquisa
  const goToPreviousSearchResult = () => {
    if (searchResults.length === 0) return;
    
    setCurrentSearchResultIndex((prev) => {
      const next = prev <= 0 ? searchResults.length - 1 : prev - 1;
      scrollToMessage(searchResults[next]);
      return next;
    });
  };

  // Função para rolar até uma mensagem específica
  const scrollToMessage = (messageIndex: number) => {
    const messageElements = document.querySelectorAll('[data-message-index]');
    if (messageElements.length > messageIndex) {
      (messageElements[messageIndex] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  return {
    messageInput,
    messageToReply,
    showEmojiPicker,
    inChatSearchTerm,
    showChatSearch,
    searchResults,
    currentSearchResultIndex,
    pendingAttachments,
    messagesEndRef,
    fileInputRef,
    setMessageInput,
    setMessageToReply,
    setShowEmojiPicker,
    setInChatSearchTerm,
    setShowChatSearch,
    setSearchResults,
    setCurrentSearchResultIndex,
    setPendingAttachments,
    sendCurrentMessage,
    replyToMessage,
    cancelReply,
    handleKeyPress,
    openFileSelector,
    handleFileUpload,
    removePendingAttachment,
    searchInMessages,
    goToNextSearchResult,
    goToPreviousSearchResult,
    scrollToMessage,
    scrollToBottom
  };
}