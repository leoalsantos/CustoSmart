import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Upload, Search, Circle, CircleDashed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChatUser } from "@/hooks/use-chat";

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

interface CanaisButtonProps {
  user: User | null;
  createRoom: (name: string, participants: number[]) => Promise<any>;
}

export function CanaisButton({ user, createRoom }: CanaisButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Lista de usuários
  const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
  
  // Buscar usuários quando o diálogo for aberto
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      // Limpar os estados quando o diálogo for aberto
      setGroupName('');
      setGroupImage(null);
      setSearchTerm('');
      setSelectedUsers([]);
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

  // Filtrar usuários com base no termo de pesquisa
  const filteredUsers = allUsers
    .filter(u => u.id !== user?.id) // Remover o usuário atual
    .filter(u => {
      if (!searchTerm.trim()) return true;
      
      const fullNameMatch = u.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
      const usernameMatch = u.username.toLowerCase().includes(searchTerm.toLowerCase());
      return fullNameMatch || usernameMatch;
    })
    .sort((a, b) => {
      // Ordenar alfabeticamente
      const nameA = a.fullName || a.username;
      const nameB = b.fullName || b.username;
      return nameA.localeCompare(nameB);
    });

  const handleUserSelect = (userId: number) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGroupImage(e.target.files[0]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, forneça um nome para o grupo.",
        variant: "destructive"
      });
      return;
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "Participantes obrigatórios",
        description: "Por favor, selecione pelo menos um participante para o grupo.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      const participants = user ? [user.id, ...selectedUsers] : selectedUsers;
      
      await createRoom(groupName, participants);
      
      toast({
        title: "Grupo criado",
        description: `O grupo "${groupName}" foi criado com sucesso.`
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o grupo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
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
        className="h-5 w-5 create-group-button" 
        onClick={() => setIsOpen(true)}
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar novo grupo</DialogTitle>
            <DialogDescription>
              Dê um nome ao grupo e selecione os participantes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Nome do grupo */}
            <div className="space-y-2">
              <Label htmlFor="group-name">Nome do grupo</Label>
              <Input
                id="group-name"
                placeholder="Digite o nome do grupo"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            
            {/* Upload de imagem */}
            <div className="space-y-2">
              <Label htmlFor="group-image">Imagem do grupo (opcional)</Label>
              <div className="flex items-center gap-4">
                {groupImage && (
                  <div className="h-16 w-16 rounded-md overflow-hidden">
                    <img 
                      src={URL.createObjectURL(groupImage)} 
                      alt="Preview" 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                )}
                <label htmlFor="group-image" className="cursor-pointer">
                  <div className="flex items-center gap-2 p-2 border border-dashed rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Upload className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-500">Selecionar imagem</span>
                  </div>
                  <input
                    type="file"
                    id="group-image"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
            
            {/* Pesquisa de usuários */}
            <div className="space-y-2">
              <Label>Participantes</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar usuários..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {/* Lista de usuários */}
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchTerm.trim() ? "Nenhum usuário encontrado" : "Nenhum outro usuário disponível"}
                  </div>
                ) : (
                  filteredUsers.map(userItem => {
                    const isSelected = selectedUsers.includes(userItem.id);
                    const isOnline = true; // Simulação de status online
                    
                    return (
                      <div
                        key={userItem.id}
                        className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => handleUserSelect(userItem.id)}
                      >
                        <Checkbox
                          id={`user-${userItem.id}`}
                          checked={isSelected}
                          onCheckedChange={() => {}}
                          className="pointer-events-none"
                        />
                        
                        <div className="flex items-center flex-1 space-x-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarFallback>{userItem.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0">
                              {getStatusIcon(isOnline)}
                            </div>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="font-medium">{userItem.fullName || userItem.username}</span>
                            <span className="text-xs text-muted-foreground">@{userItem.username}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)} variant="outline" className="mr-2">
              Cancelar
            </Button>
            <Button onClick={handleCreateGroup} disabled={isCreating}>
              {isCreating ? (
                <>
                  <span className="animate-spin mr-2">●</span>
                  Criando...
                </>
              ) : (
                'Criar grupo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}