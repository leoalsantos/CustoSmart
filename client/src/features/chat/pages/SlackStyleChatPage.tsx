import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { useToast } from '@/hooks/use-toast';
import { ChannelList } from '../components/ChannelList';
import { MessageArea } from '../components/MessageArea';
import { NewRoomDialog } from '../components/NewRoomDialog';
import { UserInfoPanel } from '../components/UserInfoPanel';
import { useChatUser } from '../hooks/use-chat-user';
import { useChatRoom } from '../hooks/use-chat-room';
import { useChatMessaging } from '../hooks/use-chat-messaging';

// Hook para detectar tamanho de tela
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return windowSize;
}

interface ChatComponentProps {
  initialRoomId?: number;
  height?: string;
  embedded?: boolean;
}

export default function SlackStyleChatPage({
  initialRoomId,
  height = 'h-screen',
  embedded = false
}: ChatComponentProps): React.ReactNode {
  // Forçar o corpo da página a ter altura completa
  useEffect(() => {
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.documentElement.style.height = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
    };
  }, []);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const windowSize = useWindowSize();
  const [isMobileView, setIsMobileView] = useState(false);
  
  // Detectar se está em mobile view
  useEffect(() => {
    setIsMobileView(windowSize.width < 768);
    
    // Em mobile, esconder a lista de canais quando uma sala está ativa
    if (windowSize.width < 768 && activeRoom) {
      setShowChannelList(false);
    } else {
      setShowChannelList(true);
    }
  }, [windowSize]);
  
  // Chat hook principal
  const {
    rooms,
    activeRoom,
    messages,
    users,
    onlineUsers,
    loading,
    typingUsers,
    sendMessage,
    joinRoom,
    leaveRoom,
    createRoom,
    setTyping,
    uploadFile
  } = useChat(initialRoomId);
  
  // Hooks personalizados para gerenciar diferentes partes do estado
  const {
    showUserInfo,
    selectedUser,
    isEditingProfile,
    userStatus,
    userStatusMessage,
    userSearchTerm,
    setUserSearchTerm,
    showUserDetails,
    hideUserDetails,
    toggleProfileEditing,
    setUserStatus,
    setUserStatusMessage,
    filterUsers
  } = useChatUser();
  
  const {
    showNewRoomDialog,
    newRoomName,
    newRoomType,
    selectedParticipants,
    showChannelList,
    activeFilter,
    setNewRoomName,
    setShowChannelList,
    setActiveFilter,
    openNewRoomDialog,
    closeNewRoomDialog,
    toggleParticipant,
    setRoomType,
    toggleChannelList,
    filterRooms
  } = useChatRoom();
  
  // Função personalizada para enviar mensagem (combinando sendMessage com uploadFile)
  const handleSendMessage = async (text: string, replyToId?: number, attachments?: File[]) => {
    try {
      if (!activeRoom) return;
      
      let attachmentData: { filename: string; url: string }[] = [];
      
      // Fazer upload de anexos, se houver
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          try {
            const uploadResult = await uploadFile(file, activeRoom.id);
            if (uploadResult) {
              attachmentData.push({
                filename: file.name,
                url: uploadResult.url
              });
            }
          } catch (error) {
            console.error('Erro ao enviar anexo:', error);
            toast({
              title: "Erro ao enviar anexo",
              description: "Não foi possível enviar um ou mais anexos.",
              variant: "destructive"
            });
          }
        }
      }
      
      // Enviar a mensagem com ou sem anexos
      sendMessage(text, activeRoom.id, replyToId, attachmentData.length > 0 ? attachmentData : undefined);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  const {
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
    scrollToMessage
  } = useChatMessaging(messages, handleSendMessage);
  
  // Efeito para enviar sinal de "está digitando"
  useEffect(() => {
    if (!activeRoom) return;
    
    if (messageInput.trim()) {
      setTyping(true, activeRoom.id);
    } else {
      setTyping(false, activeRoom.id);
    }
  }, [messageInput, activeRoom, setTyping]);
  
  return (
    <div className={`${height} bg-white dark:bg-gray-950 flex overflow-hidden`}>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Carregando chat...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex">
          {/* Lista de Canais */}
          <ChannelList
            rooms={rooms}
            users={users}
            onlineUsers={onlineUsers}
            activeRoom={activeRoom}
            userSearchTerm={userSearchTerm}
            setUserSearchTerm={setUserSearchTerm}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            joinRoom={joinRoom}
            openNewRoomDialog={openNewRoomDialog}
            isMobileView={isMobileView}
            showChannelList={showChannelList}
            toggleChannelList={toggleChannelList}
            filterRooms={filterRooms}
            filterUsers={filterUsers}
            showUserDetails={showUserDetails}
            currentUser={user}
          />
          
          {/* Área de Mensagens */}
          <MessageArea
            activeRoom={activeRoom}
            messages={messages}
            typingUsers={typingUsers}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            messageToReply={messageToReply}
            cancelReply={cancelReply}
            pendingAttachments={pendingAttachments}
            removePendingAttachment={removePendingAttachment}
            messagesEndRef={messagesEndRef}
            handleKeyPress={handleKeyPress}
            sendCurrentMessage={sendCurrentMessage}
            openFileSelector={openFileSelector}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            showChatSearch={showChatSearch}
            setShowChatSearch={setShowChatSearch}
            inChatSearchTerm={inChatSearchTerm}
            setInChatSearchTerm={setInChatSearchTerm}
            searchResults={searchResults}
            currentSearchResultIndex={currentSearchResultIndex}
            goToNextSearchResult={goToNextSearchResult}
            goToPreviousSearchResult={goToPreviousSearchResult}
            replyToMessage={replyToMessage}
            users={users}
            isMobileView={isMobileView}
            toggleChannelList={toggleChannelList}
            currentUser={user}
          />
          
          {/* Painel de Informações do Usuário */}
          <UserInfoPanel
            showUserInfo={showUserInfo}
            hideUserDetails={hideUserDetails}
            selectedUser={selectedUser}
            isEditingProfile={isEditingProfile}
            toggleProfileEditing={toggleProfileEditing}
            userStatus={userStatus}
            setUserStatus={setUserStatus}
            userStatusMessage={userStatusMessage}
            setUserStatusMessage={setUserStatusMessage}
            joinRoom={joinRoom}
            createRoom={createRoom}
            isMobileView={isMobileView}
            currentUser={user}
          />
        </div>
      )}
      
      {/* Diálogo para criar nova sala */}
      <NewRoomDialog
        showNewRoomDialog={showNewRoomDialog}
        closeNewRoomDialog={closeNewRoomDialog}
        newRoomName={newRoomName}
        setNewRoomName={setNewRoomName}
        newRoomType={newRoomType}
        setRoomType={setRoomType}
        selectedParticipants={selectedParticipants}
        toggleParticipant={toggleParticipant}
        users={users}
        createRoom={createRoom}
        currentUser={user}
      />
    </div>
  );
}