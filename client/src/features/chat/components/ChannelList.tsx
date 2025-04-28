import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, 
  Hash, 
  Lock, 
  User, 
  Users, 
  MessageSquare,
  Search,
  Menu,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { ChatRoom, ChatUser } from '@/hooks/use-chat';
import { cn } from '@/lib/utils';

interface ChannelListProps {
  rooms: ChatRoom[];
  users: ChatUser[];
  onlineUsers: Set<number>;
  activeRoom: ChatRoom | null;
  userSearchTerm: string;
  setUserSearchTerm: (term: string) => void;
  activeFilter: 'all' | 'groups' | 'directs';
  setActiveFilter: (filter: 'all' | 'groups' | 'directs') => void;
  joinRoom: (roomId: number) => void;
  openNewRoomDialog: () => void;
  isMobileView: boolean;
  showChannelList: boolean;
  toggleChannelList: () => void;
  filterRooms: (rooms: ChatRoom[]) => ChatRoom[];
  filterUsers: (users: ChatUser[]) => ChatUser[];
  showUserDetails: (user: ChatUser) => void;
  currentUser: { id: number; username: string; fullName?: string; avatar?: string; } | null;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  rooms,
  users,
  onlineUsers,
  activeRoom,
  userSearchTerm,
  setUserSearchTerm,
  activeFilter,
  setActiveFilter,
  joinRoom,
  openNewRoomDialog,
  isMobileView,
  showChannelList,
  toggleChannelList,
  filterRooms,
  filterUsers,
  showUserDetails,
  currentUser
}) => {
  // Obter listas filtradas
  const filteredRooms = filterRooms(rooms);
  const filteredUsers = filterUsers(users);

  return (
    <div 
      className={cn(
        "h-full flex flex-col bg-gray-100 dark:bg-gray-900 w-full md:w-64 border-r dark:border-gray-800",
        isMobileView && !showChannelList && "hidden"
      )}
    >
      {/* Cabeçalho da lista de canais */}
      <div className="p-3 flex justify-between items-center border-b dark:border-gray-800">
        <h2 className="font-semibold text-lg">Canais</h2>
        {isMobileView && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleChannelList}
          >
            <Menu size={18} />
          </Button>
        )}
      </div>
      
      {/* Filtros */}
      <div className="flex p-2 space-x-1 border-b dark:border-gray-800">
        <Button 
          variant={activeFilter === 'all' ? "default" : "outline"} 
          size="sm"
          className="flex-1 h-8 text-xs"
          onClick={() => setActiveFilter('all')}
        >
          Todos
        </Button>
        <Button 
          variant={activeFilter === 'groups' ? "default" : "outline"} 
          size="sm"
          className="flex-1 h-8 text-xs"
          onClick={() => setActiveFilter('groups')}
        >
          Grupos
        </Button>
        <Button 
          variant={activeFilter === 'directs' ? "default" : "outline"} 
          size="sm"
          className="flex-1 h-8 text-xs"
          onClick={() => setActiveFilter('directs')}
        >
          Diretos
        </Button>
      </div>
      
      {/* Pesquisa de canais */}
      <div className="p-2 border-b dark:border-gray-800">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          <Input
            placeholder="Buscar canais e usuários..."
            className="pl-8 h-8 text-sm"
            value={userSearchTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Lista de canais */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Cabeçalho de grupos */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
              <ChevronDown size={16} className="mr-1" />
              <span>Canais</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={openNewRoomDialog}
            >
              <Plus size={16} />
            </Button>
          </div>
          
          {/* Lista de grupos */}
          <div className="space-y-1">
            {filteredRooms
              .filter(room => room.type === 'group')
              .map(room => (
                <Button
                  key={room.id}
                  variant={activeRoom?.id === room.id ? "secondary" : "ghost"}
                  className="w-full justify-start text-sm h-8"
                  onClick={() => joinRoom(room.id)}
                >
                  {room.isPrivate ? (
                    <Lock size={16} className="mr-2 flex-shrink-0" />
                  ) : (
                    <Hash size={16} className="mr-2 flex-shrink-0" />
                  )}
                  <span className="truncate">{room.name}</span>
                </Button>
              ))}
          </div>
          
          <Separator className="my-2" />
          
          {/* Cabeçalho de mensagens diretas */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
              <ChevronDown size={16} className="mr-1" />
              <span>Mensagens Diretas</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={openNewRoomDialog}
            >
              <Plus size={16} />
            </Button>
          </div>
          
          {/* Lista de salas de mensagens diretas */}
          <div className="space-y-1">
            {filteredRooms
              .filter(room => room.type === 'direct')
              .map(room => {
                // Para salas diretas, mostrar o nome do outro usuário
                const otherUser = room.participants?.find(
                  p => currentUser && p.id !== currentUser.id
                );
                
                return (
                  <Button
                    key={room.id}
                    variant={activeRoom?.id === room.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-sm h-8"
                    onClick={() => joinRoom(room.id)}
                  >
                    <User size={16} className="mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {otherUser?.username || room.name}
                    </span>
                  </Button>
                );
              })}
          </div>
          
          <Separator className="my-2" />
          
          {/* Lista de usuários */}
          <div className="flex items-center py-2">
            <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
              <ChevronDown size={16} className="mr-1" />
              <span>Usuários</span>
            </div>
          </div>
          
          <div className="space-y-1">
            {filteredUsers
              .filter(u => currentUser && u.id !== currentUser.id)
              .map(user => (
                <Button
                  key={user.id}
                  variant="ghost"
                  className="w-full justify-start text-sm h-8"
                  onClick={() => showUserDetails(user)}
                >
                  <div className="relative mr-2 flex-shrink-0">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={user.avatar || undefined} alt={user.username} />
                      <AvatarFallback className="text-xs">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {onlineUsers.has(user.id) && (
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-1 ring-white dark:ring-gray-900" />
                    )}
                  </div>
                  <span className="truncate">{user.username}</span>
                </Button>
              ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};