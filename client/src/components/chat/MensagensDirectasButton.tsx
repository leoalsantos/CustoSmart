import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Search, Circle, CircleDashed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Definindo tipo User localmente para evitar problemas de importação
type User = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  permissions: any;
  active: boolean;
};
import { ChatUser } from "@/hooks/use-chat";

interface MensagensDirectasButtonProps {
  user: User | null;
  users: ChatUser[];
  handleUserSelect: (user: ChatUser) => Promise<void>;
}

export function MensagensDirectasButton({ user, users, handleUserSelect }: MensagensDirectasButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<ChatUser[]>([]);

  // Buscar usuários quando o diálogo for aberto
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setSearchTerm('');
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/chat/users');
      if (!response.ok) {
        throw new Error('Falha ao buscar usuários');
      }
      const users = await response.json();
      setAllUsers(users);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive"
      });
    }
  };

  // Filtrar usuários com base no termo de pesquisa e ordenar alfabeticamente
  const filteredUsers = allUsers
    .filter(u => u.id !== user?.id) // Remover o usuário atual
    .filter(u => {
      // Filtrar por termo de pesquisa
      if (!searchTerm.trim()) return true;
      
      const fullNameMatch = u.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
      const usernameMatch = u.username.toLowerCase().includes(searchTerm.toLowerCase());
      return fullNameMatch || usernameMatch;
    })
    .sort((a, b) => {
      // Ordenar alfabeticamente por nome completo ou nome de usuário
      const nameA = a.fullName || a.username;
      const nameB = b.fullName || b.username;
      return nameA.localeCompare(nameB);
    });

  const initiateChat = async (selectedUser: ChatUser) => {
    if (!selectedUser) return;
    
    setLoading(selectedUser.id);
    try {
      await handleUserSelect(selectedUser);
      toast({
        title: "Conversa iniciada",
        description: `Conversa com ${selectedUser.fullName || selectedUser.username} iniciada`
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao iniciar conversa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a conversa. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  // Função para mostrar ícone de status
  const getStatusIcon = (isOnline: boolean) => {
    return isOnline 
      ? <Circle className="h-3 w-3 text-green-500 fill-green-500" /> 
      : <CircleDashed className="h-3 w-3 text-gray-500" />;
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-5 w-5 create-direct-button" 
        onClick={() => setIsOpen(true)}
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova mensagem direta</DialogTitle>
            <DialogDescription>
              Selecione um usuário para iniciar uma conversa
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Barra de pesquisa de usuários */}
            <div className="space-y-2">
              <Label htmlFor="search-users">Usuários</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search-users"
                  placeholder="Buscar usuários..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {/* Lista de usuários */}
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchTerm.trim() ? "Nenhum usuário encontrado" : "Nenhum outro usuário disponível"}
                  </div>
                ) : (
                  filteredUsers.map((userItem) => {
                    // Verificar se o usuário está online (isso seria integrado com seu sistema real)
                    const isOnline = true; // Simular usuário online para demonstração
                    
                    return (
                      <div
                        key={userItem.id}
                        className="flex items-center p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        onClick={() => initiateChat(userItem)}
                      >
                        <div className="relative mr-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={userItem.profileImage || ''} />
                            <AvatarFallback className="bg-primary/10">
                              {userItem.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute bottom-0 right-0">
                            {getStatusIcon(isOnline)}
                          </div>
                        </div>
                        
                        <div className="flex flex-col text-left">
                          <span className="font-medium">{userItem.fullName || userItem.username}</span>
                          <span className="text-xs text-muted-foreground">@{userItem.username}</span>
                        </div>
                        
                        {loading === userItem.id && (
                          <div className="ml-auto">
                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)} variant="outline">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}