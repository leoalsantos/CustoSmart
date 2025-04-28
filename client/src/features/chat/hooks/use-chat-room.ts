import { useState } from 'react';
import { ChatRoom } from '@/hooks/use-chat';

export interface ChatRoomState {
  showNewRoomDialog: boolean;
  newRoomName: string;
  newRoomType: 'group' | 'direct';
  selectedParticipants: number[];
  showChannelList: boolean;
  activeFilter: 'all' | 'groups' | 'directs';
}

export function useChatRoom() {
  const [showNewRoomDialog, setShowNewRoomDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'group' | 'direct'>('group');
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [showChannelList, setShowChannelList] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'groups' | 'directs'>('all');

  // Função para abrir o diálogo de nova sala
  const openNewRoomDialog = () => {
    setShowNewRoomDialog(true);
  };

  // Função para fechar o diálogo de nova sala
  const closeNewRoomDialog = () => {
    setShowNewRoomDialog(false);
    setNewRoomName('');
    setSelectedParticipants([]);
  };

  // Função para alternar a seleção de um participante
  const toggleParticipant = (userId: number) => {
    setSelectedParticipants(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Função para alternar o tipo de sala
  const setRoomType = (type: 'group' | 'direct') => {
    setNewRoomType(type);
    if (type === 'direct') {
      setNewRoomName(''); // Nomes não são necessários para mensagens diretas
    }
  };

  // Função para alternar a visibilidade da lista de canais (útil para mobile)
  const toggleChannelList = () => {
    setShowChannelList(prev => !prev);
  };

  // Função para filtrar salas com base no tipo ativo
  const filterRooms = (rooms: ChatRoom[]) => {
    if (activeFilter === 'all') return rooms;
    if (activeFilter === 'groups') return rooms.filter(room => room.type === 'group');
    if (activeFilter === 'directs') return rooms.filter(room => room.type === 'direct');
    return rooms;
  };

  return {
    showNewRoomDialog,
    newRoomName,
    newRoomType,
    selectedParticipants,
    showChannelList,
    activeFilter,
    setShowNewRoomDialog,
    setNewRoomName,
    setNewRoomType,
    setSelectedParticipants,
    setShowChannelList,
    setActiveFilter,
    openNewRoomDialog,
    closeNewRoomDialog,
    toggleParticipant,
    setRoomType,
    toggleChannelList,
    filterRooms
  };
}