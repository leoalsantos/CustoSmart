import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Reply, 
  Search,
  X,
  ArrowUp,
  ArrowDown,
  CornerUpRight,
  File as FileIcon,
  Image as ImageIcon,
  FileAudio,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChatMessage, ChatRoom, ChatUser } from '@/hooks/use-chat';

interface MessageAreaProps {
  activeRoom: ChatRoom | null;
  messages: ChatMessage[];
  typingUsers: Map<number, string>;
  messageInput: string;
  setMessageInput: (input: string) => void;
  messageToReply: ChatMessage | null;
  cancelReply: () => void;
  pendingAttachments: File[];
  removePendingAttachment: (index: number) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  sendCurrentMessage: () => void;
  openFileSelector: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showChatSearch: boolean;
  setShowChatSearch: (show: boolean) => void;
  inChatSearchTerm: string;
  setInChatSearchTerm: (term: string) => void;
  searchResults: number[];
  currentSearchResultIndex: number;
  goToNextSearchResult: () => void;
  goToPreviousSearchResult: () => void;
  replyToMessage: (message: ChatMessage) => void;
  users: ChatUser[];
  isMobileView: boolean;
  toggleChannelList: () => void;
  currentUser: { id: number; username: string } | null;
}

export const MessageArea: React.FC<MessageAreaProps> = ({
  activeRoom,
  messages,
  typingUsers,
  messageInput,
  setMessageInput,
  messageToReply,
  cancelReply,
  pendingAttachments,
  removePendingAttachment,
  messagesEndRef,
  handleKeyPress,
  sendCurrentMessage,
  openFileSelector,
  fileInputRef,
  handleFileUpload,
  showChatSearch,
  setShowChatSearch,
  inChatSearchTerm,
  setInChatSearchTerm,
  searchResults,
  currentSearchResultIndex,
  goToNextSearchResult,
  goToPreviousSearchResult,
  replyToMessage,
  users,
  isMobileView,
  toggleChannelList,
  currentUser
}) => {
  // Função para encontrar o usuário pelo ID
  const findUserById = (userId: number): ChatUser | undefined => {
    return users.find(u => u.id === userId);
  };

  // Função para obter o tipo de arquivo (imagem, áudio, outro)
  const getFileType = (filename: string): 'image' | 'audio' | 'other' => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    }
    if (['mp3', 'wav', 'ogg'].includes(extension)) {
      return 'audio';
    }
    return 'other';
  };

  // Função para renderizar um anexo
  const renderAttachment = (attachment: { filename: string; url: string }) => {
    const fileType = getFileType(attachment.filename);
    
    if (fileType === 'image') {
      return (
        <div className="mt-2 rounded-md overflow-hidden">
          <img 
            src={attachment.url} 
            alt={attachment.filename} 
            className="max-w-xs max-h-48 object-contain" 
          />
        </div>
      );
    }
    
    if (fileType === 'audio') {
      return (
        <div className="mt-2">
          <audio controls className="max-w-full">
            <source src={attachment.url} />
            Seu navegador não suporta o elemento de áudio.
          </audio>
        </div>
      );
    }
    
    // Outros tipos de arquivo
    return (
      <div className="mt-2 flex items-center p-2 rounded-md bg-gray-100 dark:bg-gray-800">
        <FileIcon size={16} className="mr-2" />
        <a 
          href={attachment.url} 
          target="_blank" 
          rel="noreferrer"
          className="text-sm text-blue-500 hover:underline overflow-hidden text-ellipsis"
        >
          {attachment.filename}
        </a>
      </div>
    );
  };

  // Função para renderizar mensagem de resposta
  const renderReplyMessage = (replyToId: number) => {
    const replyTo = messages.find(m => m.id === replyToId);
    if (!replyTo) return null;
    
    const replyUser = findUserById(replyTo.userId);
    
    return (
      <div className="ml-6 mt-1 flex items-start space-x-2 text-xs text-gray-500 dark:text-gray-400 border-l-2 border-gray-300 dark:border-gray-700 pl-2">
        <CornerUpRight size={12} className="flex-shrink-0 mt-0.5" />
        <div className="overflow-hidden">
          <span className="font-semibold">
            {replyUser?.username || 'Usuário'}:
          </span>{' '}
          <span className="truncate">
            {replyTo.content || (replyTo.attachments && replyTo.attachments.length > 0 ? '[Anexo]' : '')}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full flex-1">
      {/* Cabeçalho do chat */}
      <div className="p-3 border-b dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-950">
        {isMobileView && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={toggleChannelList}
          >
            <MoreHorizontal size={18} />
          </Button>
        )}
        
        <div className="flex items-center">
          {activeRoom?.type === 'group' ? (
            <div className="flex-shrink-0 w-6 h-6 rounded bg-gray-200 dark:bg-gray-800 flex items-center justify-center mr-2">
              {activeRoom.isPrivate ? '🔒' : '#'}
            </div>
          ) : (
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage 
                src={activeRoom?.participants?.find(
                  p => currentUser && p.id !== currentUser.id
                )?.avatar || undefined} 
                alt={activeRoom?.name}
              />
              <AvatarFallback>
                {activeRoom?.name.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          )}
          <h3 className="font-medium text-sm">
            {activeRoom?.name || 'Selecione um canal'}
          </h3>
        </div>
        
        <div className="flex">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowChatSearch(!showChatSearch)}
            className={cn(showChatSearch && "bg-gray-200 dark:bg-gray-800")}
          >
            <Search size={16} />
          </Button>
        </div>
      </div>
      
      {/* Barra de pesquisa no chat */}
      {showChatSearch && (
        <div className="p-2 border-b dark:border-gray-800 flex items-center gap-2 bg-gray-50 dark:bg-gray-900">
          <Input
            placeholder="Pesquisar neste chat..."
            className="h-8 text-sm"
            value={inChatSearchTerm}
            onChange={(e) => setInChatSearchTerm(e.target.value)}
          />
          <div className="flex space-x-1">
            <Button 
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={searchResults.length === 0}
              onClick={goToPreviousSearchResult}
            >
              <ArrowUp size={16} />
            </Button>
            <Button 
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={searchResults.length === 0}
              onClick={goToNextSearchResult}
            >
              <ArrowDown size={16} />
            </Button>
            <Button 
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => setShowChatSearch(false)}
            >
              <X size={16} />
            </Button>
          </div>
          <div className="text-xs text-gray-500">
            {searchResults.length > 0 
              ? `${currentSearchResultIndex + 1} de ${searchResults.length}`
              : "Nenhum resultado"}
          </div>
        </div>
      )}
      
      {/* Área de mensagens */}
      <ScrollArea className="flex-1 p-4">
        {activeRoom ? (
          <>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-lg mb-2">Nenhuma mensagem ainda</div>
                <div className="text-sm">Seja o primeiro a enviar uma mensagem!</div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const sender = findUserById(message.userId);
                  const isCurrentUser = currentUser?.id === message.userId;
                  const messageDate = new Date(message.timestamp);
                  
                  const isHighlighted = searchResults.includes(index) && 
                                      index === searchResults[currentSearchResultIndex];
                  
                  return (
                    <div 
                      key={message.id} 
                      className={cn(
                        "group flex",
                        isHighlighted && "bg-yellow-100 dark:bg-yellow-900/20 -mx-2 px-2 py-1 rounded"
                      )}
                      data-message-index={index}
                    >
                      <Avatar className="h-8 w-8 mt-1 mr-2 flex-shrink-0">
                        <AvatarImage 
                          src={sender?.avatar || undefined} 
                          alt={sender?.username || 'Usuário'}
                        />
                        <AvatarFallback>
                          {sender?.username.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start">
                          <div className="flex items-center">
                            <span className="font-medium text-sm">
                              {sender?.username || 'Usuário'}
                            </span>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              {format(messageDate, 'HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                          
                          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreVertical size={14} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => replyToMessage(message)}
                                >
                                  <Reply size={14} className="mr-2" />
                                  Responder
                                </DropdownMenuItem>
                                {isCurrentUser && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <Edit size={14} className="mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">
                                      <Trash2 size={14} className="mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        {message.replyToId && renderReplyMessage(message.replyToId)}
                        
                        {message.content && (
                          <div className="text-sm mt-1 whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                        )}
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="space-y-2">
                            {message.attachments.map((attachment, i) => (
                              <div key={i}>{renderAttachment(attachment)}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Indicador de digitação */}
                {Array.from(typingUsers.entries()).map(([userId, username]) => {
                  if (userId === currentUser?.id) return null;
                  return (
                    <div key={userId} className="text-xs text-gray-500 dark:text-gray-400 italic">
                      {username} está digitando...
                    </div>
                  );
                })}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-lg mb-2">Selecione um canal para começar</div>
            <div className="text-sm">Ou crie um novo canal clicando no botão + na barra lateral</div>
          </div>
        )}
      </ScrollArea>
      
      {/* Área de entrada de mensagem */}
      {activeRoom && (
        <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-800">
          {/* Área de mensagem sendo respondida */}
          {messageToReply && (
            <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded flex justify-between items-start text-sm">
              <div>
                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                  <Reply size={14} className="mr-1" />
                  Respondendo para{' '}
                  <span className="font-medium ml-1">
                    {findUserById(messageToReply.userId)?.username || 'Usuário'}
                  </span>
                </div>
                <div className="truncate text-xs">
                  {messageToReply.content || '[Anexo]'}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5"
                onClick={cancelReply}
              >
                <X size={14} />
              </Button>
            </div>
          )}
          
          {/* Área de anexos pendentes */}
          {pendingAttachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pendingAttachments.map((file, index) => {
                const fileType = getFileType(file.name);
                return (
                  <div 
                    key={index}
                    className="bg-gray-100 dark:bg-gray-800 rounded p-1 pl-2 flex items-center text-sm"
                  >
                    {fileType === 'image' && <ImageIcon size={14} className="mr-1" />}
                    {fileType === 'audio' && <FileAudio size={14} className="mr-1" />}
                    {fileType === 'other' && <FileIcon size={14} className="mr-1" />}
                    <span className="max-w-[140px] truncate">{file.name}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 ml-1"
                      onClick={() => removePendingAttachment(index)}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Textarea
                placeholder="Digite sua mensagem..."
                className="min-h-20 max-h-60 p-3"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>
            
            <div className="flex space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={openFileSelector}
                    >
                      <Paperclip size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Anexar arquivo</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileUpload}
              />
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                    >
                      <Smile size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Inserir emoji</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button
                onClick={sendCurrentMessage}
                disabled={!messageInput.trim() && pendingAttachments.length === 0}
              >
                <Send size={18} className="mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};