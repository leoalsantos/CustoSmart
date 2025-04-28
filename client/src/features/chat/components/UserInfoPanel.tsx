import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  X, 
  MessageSquare, 
  Phone, 
  Mail, 
  Edit,
  Check,
  Clock
} from 'lucide-react';
import { ChatUser } from '@/hooks/use-chat';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserInfoPanelProps {
  showUserInfo: boolean;
  hideUserDetails: () => void;
  selectedUser: ChatUser | null;
  isEditingProfile: boolean;
  toggleProfileEditing: () => void;
  userStatus: string;
  setUserStatus: (status: string) => void;
  userStatusMessage: string;
  setUserStatusMessage: (message: string) => void;
  joinRoom: (roomId: number) => void;
  createRoom: (name: string, isPrivate: boolean, type: 'group' | 'direct', participantIds: number[]) => void;
  isMobileView: boolean;
  currentUser: { id: number } | null;
}

export const UserInfoPanel: React.FC<UserInfoPanelProps> = ({
  showUserInfo,
  hideUserDetails,
  selectedUser,
  isEditingProfile,
  toggleProfileEditing,
  userStatus,
  setUserStatus,
  userStatusMessage,
  setUserStatusMessage,
  joinRoom,
  createRoom,
  isMobileView,
  currentUser
}) => {
  const handleStartDirectMessage = () => {
    if (!selectedUser || !currentUser) return;
    
    // Procurar se já existe uma sala direta entre os usuários
    // Se não existir, criar uma nova
    createRoom(
      `DM: ${currentUser.id}-${selectedUser.id}`,
      false,
      'direct',
      [selectedUser.id]
    );
    
    // Fechar o painel de informações do usuário
    hideUserDetails();
  };

  return (
    <div 
      className={`
        h-full flex flex-col bg-white dark:bg-gray-950 w-full md:w-72 border-l dark:border-gray-800
        ${!showUserInfo && "hidden"}
      `}
    >
      {selectedUser ? (
        <>
          {/* Cabeçalho */}
          <div className="p-3 flex justify-between items-center border-b dark:border-gray-800">
            <h3 className="font-semibold text-sm">Perfil do usuário</h3>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={hideUserDetails}
            >
              <X size={18} />
            </Button>
          </div>
          
          {/* Conteúdo */}
          <div className="flex-1 overflow-auto p-4">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-20 w-20 mb-3">
                <AvatarImage 
                  src={selectedUser.avatar || undefined} 
                  alt={selectedUser.username}
                />
                <AvatarFallback className="text-2xl">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <h2 className="font-bold text-lg">{selectedUser.fullName}</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                @{selectedUser.username}
              </div>
              
              {/* Mostrar apenas para outros usuários */}
              {currentUser && selectedUser.id !== currentUser.id && (
                <div className="mt-3 flex space-x-2">
                  <Button 
                    size="sm"
                    onClick={handleStartDirectMessage}
                  >
                    <MessageSquare size={14} className="mr-1" />
                    Mensagem
                  </Button>
                </div>
              )}
            </div>
            
            {/* Informações de contato */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Sobre</h4>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm">
                  {selectedUser.bio || "Sem informações adicionais."}
                </div>
              </div>
              
              {/* Status (apenas editável pelo próprio usuário) */}
              {currentUser && selectedUser.id === currentUser.id && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-sm">Status</h4>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={toggleProfileEditing}
                    >
                      {isEditingProfile ? <Check size={14} /> : <Edit size={14} />}
                    </Button>
                  </div>
                  {isEditingProfile ? (
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Button
                          variant={userStatus === 'online' ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() => setUserStatus('online')}
                        >
                          Online
                        </Button>
                        <Button
                          variant={userStatus === 'away' ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() => setUserStatus('away')}
                        >
                          Ausente
                        </Button>
                        <Button
                          variant={userStatus === 'busy' ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() => setUserStatus('busy')}
                        >
                          Ocupado
                        </Button>
                      </div>
                      <Textarea
                        placeholder="O que você está fazendo?"
                        className="text-sm"
                        value={userStatusMessage}
                        onChange={(e) => setUserStatusMessage(e.target.value)}
                        maxLength={100}
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md flex items-center text-sm">
                      <div className="mr-2">
                        {userStatus === 'online' && (
                          <div className="h-3 w-3 rounded-full bg-green-500" />
                        )}
                        {userStatus === 'away' && (
                          <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        )}
                        {userStatus === 'busy' && (
                          <div className="h-3 w-3 rounded-full bg-red-500" />
                        )}
                      </div>
                      <div>
                        {userStatusMessage || `${userStatus === 'online' ? 'Disponível' : userStatus === 'away' ? 'Ausente' : 'Ocupado'}`}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Informações adicionais */}
              <div>
                <h4 className="font-medium text-sm mb-2">Informações</h4>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                  {selectedUser.email && (
                    <div className="flex items-center py-1 text-sm">
                      <Mail size={14} className="mr-2 text-gray-500" />
                      <span>{selectedUser.email}</span>
                    </div>
                  )}
                  
                  {selectedUser.phone && (
                    <div className="flex items-center py-1 text-sm">
                      <Phone size={14} className="mr-2 text-gray-500" />
                      <span>{selectedUser.phone}</span>
                    </div>
                  )}
                  
                  {selectedUser.createdAt && (
                    <div className="flex items-center py-1 text-sm">
                      <Clock size={14} className="mr-2 text-gray-500" />
                      <span>
                        Entrou em {format(new Date(selectedUser.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          Selecione um usuário para ver detalhes
        </div>
      )}
    </div>
  );
};