import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatUser } from '@/hooks/use-chat';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Hash, Lock, User } from 'lucide-react';

interface NewRoomDialogProps {
  showNewRoomDialog: boolean;
  closeNewRoomDialog: () => void;
  newRoomName: string;
  setNewRoomName: (name: string) => void;
  newRoomType: 'group' | 'direct';
  setRoomType: (type: 'group' | 'direct') => void;
  selectedParticipants: number[];
  toggleParticipant: (userId: number) => void;
  users: ChatUser[];
  createRoom: (name: string, isPrivate: boolean, type: 'group' | 'direct', participantIds: number[]) => void;
  currentUser: { id: number } | null;
}

export const NewRoomDialog: React.FC<NewRoomDialogProps> = ({
  showNewRoomDialog,
  closeNewRoomDialog,
  newRoomName,
  setNewRoomName,
  newRoomType,
  setRoomType,
  selectedParticipants,
  toggleParticipant,
  users,
  createRoom,
  currentUser
}) => {
  // Função para criar uma nova sala
  const handleCreateRoom = () => {
    if (newRoomType === 'group' && !newRoomName.trim()) {
      // Exibir erro ou notificação de que o nome é necessário
      return;
    }
    
    if (newRoomType === 'direct' && selectedParticipants.length !== 1) {
      // Exibir erro ou notificação de que é necessário selecionar exatamente um participante
      return;
    }
    
    createRoom(
      newRoomName.trim(), 
      false, // isPrivate (poderia ser um estado adicional para grupos privados)
      newRoomType,
      selectedParticipants
    );
    
    closeNewRoomDialog();
  };

  return (
    <Dialog open={showNewRoomDialog} onOpenChange={closeNewRoomDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar nova sala</DialogTitle>
          <DialogDescription>
            {newRoomType === 'group' 
              ? 'Crie um novo canal de grupo para conversas com várias pessoas.'
              : 'Inicie uma conversa direta com outro usuário.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex space-x-2 mb-4">
          <Button
            variant={newRoomType === 'group' ? "default" : "outline"}
            className="flex-1"
            onClick={() => setRoomType('group')}
          >
            <Hash size={16} className="mr-2" />
            Grupo
          </Button>
          <Button
            variant={newRoomType === 'direct' ? "default" : "outline"}
            className="flex-1"
            onClick={() => setRoomType('direct')}
          >
            <User size={16} className="mr-2" />
            Mensagem Direta
          </Button>
        </div>
        
        {newRoomType === 'group' && (
          <div className="mb-4">
            <label className="text-sm font-medium block mb-2">
              Nome do canal
            </label>
            <Input
              placeholder="ex: geral, suporte, vendas..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
            />
          </div>
        )}
        
        <div>
          <label className="text-sm font-medium block mb-2">
            {newRoomType === 'group' 
              ? 'Adicionar participantes (opcional)'
              : 'Selecione um usuário'}
          </label>
          <ScrollArea className="h-60 border rounded-md">
            <div className="p-2 space-y-1">
              {users
                .filter(user => currentUser && user.id !== currentUser.id)
                .map(user => (
                  <div
                    key={user.id}
                    className={`
                      p-2 rounded-md flex items-center space-x-2 cursor-pointer
                      ${selectedParticipants.includes(user.id) 
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-900'}
                    `}
                    onClick={() => toggleParticipant(user.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user.avatar || undefined} 
                        alt={user.username}
                      />
                      <AvatarFallback>
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {user.fullName || user.username}
                      </div>
                      {user.fullName && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          @{user.username}
                        </div>
                      )}
                    </div>
                    {selectedParticipants.includes(user.id) && (
                      <div className="h-4 w-4 rounded-full bg-primary"></div>
                    )}
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={closeNewRoomDialog}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateRoom}
            disabled={(newRoomType === 'group' && !newRoomName.trim()) || 
                     (newRoomType === 'direct' && selectedParticipants.length !== 1)}
          >
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};