import { useState } from 'react';
import { ChatUser } from '@/hooks/use-chat';

export interface ChatUserState {
  showUserInfo: boolean;
  selectedUser: ChatUser | null;
  isEditingProfile: boolean;
  userStatus: string;
  userStatusMessage: string;
  userSearchTerm: string;
}

export function useChatUser() {
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userStatus, setUserStatus] = useState('online');
  const [userStatusMessage, setUserStatusMessage] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Função para exibir informações de um usuário
  const showUserDetails = (user: ChatUser) => {
    setSelectedUser(user);
    setShowUserInfo(true);
  };

  // Função para ocultar informações de usuário
  const hideUserDetails = () => {
    setShowUserInfo(false);
  };

  // Função para alternar o modo de edição de perfil
  const toggleProfileEditing = () => {
    setIsEditingProfile(prev => !prev);
  };

  // Função para atualizar o status do usuário
  const updateUserStatus = (status: string) => {
    setUserStatus(status);
  };

  // Função para atualizar a mensagem de status do usuário
  const updateUserStatusMessage = (message: string) => {
    setUserStatusMessage(message);
  };

  // Função para filtrar usuários com base na pesquisa
  const filterUsers = (users: ChatUser[]) => {
    if (!userSearchTerm.trim()) return users;
    
    return users.filter(
      user => 
        user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
        (user.fullName && user.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()))
    );
  };

  return {
    showUserInfo,
    selectedUser,
    isEditingProfile,
    userStatus,
    userStatusMessage,
    userSearchTerm,
    setUserSearchTerm,
    setShowUserInfo,
    setSelectedUser,
    setIsEditingProfile,
    setUserStatus,
    setUserStatusMessage,
    showUserDetails,
    hideUserDetails,
    toggleProfileEditing,
    updateUserStatus,
    updateUserStatusMessage,
    filterUsers
  };
}