import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Circle,
  Clock,
  FileImage,
  SmilePlus,
  Upload,
  X,
  Check,
  CircleDashed,
  AlertCircle,
  BellOff,
  Bot
} from "lucide-react";

const statusSchema = z.object({
  status: z.enum(["online", "away", "busy", "offline"]),
  statusMessage: z.string().max(100, "A mensagem de status deve ter no máximo 100 caracteres").optional(),
  showAsOfflineAfter: z.number().optional(),
});

const autoMessageSchema = z.object({
  enabled: z.boolean().default(false),
  awayMessage: z.string().max(500, "A mensagem automática deve ter no máximo 500 caracteres").optional(),
  busyMessage: z.string().max(500, "A mensagem automática deve ter no máximo 500 caracteres").optional(),
  offlineMessage: z.string().max(500, "A mensagem automática deve ter no máximo 500 caracteres").optional(),
});

const profileSchema = z.object({
  profileImage: z.instanceof(File).optional(),
});

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: string;
  currentStatus?: string;
  currentStatusMessage?: string;
  currentProfileImage?: string | null;
  onStatusChange?: (status: string, statusMessage?: string) => void;
  onProfileImageChange?: (imageUrl: string | null) => void;
  onAutoResponseChange?: (enabled: boolean, messages: {
    awayMessage?: string;
    busyMessage?: string;
    offlineMessage?: string;
  }) => void;
}

export function UserProfileDialog({
  open,
  onOpenChange,
  initialTab = "status",
  currentStatus = "online",
  currentStatusMessage = "",
  currentProfileImage = null,
  onStatusChange,
  onProfileImageChange,
  onAutoResponseChange,
}: UserProfileDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(currentProfileImage);
  const [autoResponses, setAutoResponses] = useState({
    enabled: false,
    awayMessage: "Estou temporariamente ausente. Retornarei em breve.",
    busyMessage: "Estou ocupado no momento. Responderei assim que possível.",
    offlineMessage: "Estou offline no momento. Verei sua mensagem quando voltar.",
  });

  // Formulário para status
  const statusForm = useForm<z.infer<typeof statusSchema>>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      status: currentStatus as "online" | "away" | "busy" | "offline",
      statusMessage: currentStatusMessage,
      showAsOfflineAfter: 30,
    },
  });

  // Formulário para mensagens automáticas
  const autoMessageForm = useForm<z.infer<typeof autoMessageSchema>>({
    resolver: zodResolver(autoMessageSchema),
    defaultValues: {
      enabled: autoResponses.enabled,
      awayMessage: autoResponses.awayMessage,
      busyMessage: autoResponses.busyMessage,
      offlineMessage: autoResponses.offlineMessage,
    },
  });

  // Formulário para perfil/foto
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {},
  });

  // Atualiza o status
  const onStatusSubmit = async (data: z.infer<typeof statusSchema>) => {
    try {
      // Aqui seria feita a chamada API para atualizar o status
      console.log("Atualizando status:", data);
      
      // Chama a função de callback se existir
      if (onStatusChange) {
        onStatusChange(data.status, data.statusMessage);
      }
      
      toast({
        title: "Status atualizado",
        description: "Seu status foi atualizado com sucesso",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar seu status. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Atualiza mensagens automáticas
  const onAutoMessageSubmit = async (data: z.infer<typeof autoMessageSchema>) => {
    try {
      // Aqui seria feita a chamada API para atualizar as mensagens automáticas
      console.log("Atualizando mensagens automáticas:", data);
      
      const updatedAutoResponses = {
        enabled: data.enabled,
        awayMessage: data.awayMessage || autoResponses.awayMessage,
        busyMessage: data.busyMessage || autoResponses.busyMessage,
        offlineMessage: data.offlineMessage || autoResponses.offlineMessage,
      };
      
      setAutoResponses(updatedAutoResponses);
      
      // Chama a função de callback se existir
      if (onAutoResponseChange) {
        onAutoResponseChange(data.enabled, {
          awayMessage: updatedAutoResponses.awayMessage,
          busyMessage: updatedAutoResponses.busyMessage,
          offlineMessage: updatedAutoResponses.offlineMessage,
        });
      }
      
      toast({
        title: "Mensagens automáticas atualizadas",
        description: data.enabled 
          ? "Suas mensagens automáticas foram ativadas" 
          : "Suas mensagens automáticas foram desativadas",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar mensagens automáticas:", error);
      toast({
        title: "Erro ao atualizar mensagens automáticas",
        description: "Não foi possível atualizar suas mensagens automáticas. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Atualiza foto de perfil
  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      if (!data.profileImage && !profileImagePreview) {
        toast({
          title: "Nenhuma imagem selecionada",
          description: "Por favor, selecione uma imagem para continuar.",
          variant: "destructive",
        });
        return;
      }
      
      // Se temos uma nova imagem para upload
      if (data.profileImage) {
        // Aqui seria feita a chamada API para fazer upload da imagem
        console.log("Enviando nova imagem de perfil:", data.profileImage);

        const formData = new FormData();
        formData.append("profileImage", data.profileImage);
        
        // Simulação de chamada API
        // const response = await fetch('/api/user/profile-image', {
        //   method: 'POST',
        //   body: formData,
        // });
        
        // Aqui vamos simular que recebemos a URL da imagem do servidor
        // Em uma implementação real, isso viria da resposta da API
        // Vamos usar o preview para simular a URL da imagem no servidor
        
        // Chama o callback para atualizar a imagem do perfil no componente pai
        if (onProfileImageChange && profileImagePreview) {
          onProfileImageChange(profileImagePreview);
        }
        
        toast({
          title: "Foto de perfil atualizada",
          description: "Sua foto de perfil foi atualizada com sucesso",
        });
      } else if (profileImagePreview && onProfileImageChange) {
        // Se já temos uma imagem de preview mas não um novo arquivo, 
        // podemos usar a imagem atual
        onProfileImageChange(profileImagePreview);
        
        toast({
          title: "Foto de perfil atualizada",
          description: "Sua foto de perfil foi confirmada",
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar foto de perfil:", error);
      toast({
        title: "Erro ao atualizar foto",
        description: "Não foi possível atualizar sua foto de perfil. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Manipulador de alteração de arquivo de imagem
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validação de tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }
      
      // Validação de tipo
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo de imagem válido",
          variant: "destructive",
        });
        return;
      }
      
      profileForm.setValue("profileImage", file);
      
      // Cria uma URL para a imagem selecionada para pré-visualização
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <Circle className="h-4 w-4 text-green-500 fill-green-500" />;
      case "away":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "busy":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "offline":
        return <CircleDashed className="h-4 w-4 text-gray-500" />;
      default:
        return <Circle className="h-4 w-4 text-green-500 fill-green-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Disponível";
      case "away":
        return "Ausente";
      case "busy":
        return "Ocupado";
      case "offline":
        return "Offline";
      default:
        return "Disponível";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Perfil do Usuário</DialogTitle>
          <DialogDescription>
            Configure seu perfil, status e mensagens automáticas.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="autoMessage">Respostas Automáticas</TabsTrigger>
            <TabsTrigger value="profile">Foto de Perfil</TabsTrigger>
          </TabsList>
          
          {/* Tab de Status */}
          <TabsContent value="status">
            <Form {...statusForm}>
              <form onSubmit={statusForm.handleSubmit(onStatusSubmit)} className="space-y-4">
                <FormField
                  control={statusForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">
                            <div className="flex items-center gap-2">
                              <Circle className="h-4 w-4 text-green-500 fill-green-500" />
                              <span>Disponível</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="away">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-yellow-500" />
                              <span>Ausente</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="busy">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span>Ocupado</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="offline">
                            <div className="flex items-center gap-2">
                              <CircleDashed className="h-4 w-4 text-gray-500" />
                              <span>Offline</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={statusForm.control}
                  name="statusMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem de Status (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Em reunião até 15h"
                          className="resize-none h-20"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Essa mensagem será exibida junto ao seu status
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={statusForm.control}
                  name="showAsOfflineAfter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mostrar como ausente após inatividade</FormLabel>
                      <div className="flex space-x-2 items-center">
                        <FormControl>
                          <Input 
                            type="number" 
                            min="5" 
                            max="120" 
                            className="w-20" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            value={field.value || 30}
                          />
                        </FormControl>
                        <span>minutos</span>
                      </div>
                      <FormDescription>
                        Seu status mudará para ausente após esse período sem atividade
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="mt-4">
                  <Button type="submit">Salvar Status</Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          {/* Tab de Mensagens Automáticas */}
          <TabsContent value="autoMessage">
            <Form {...autoMessageForm}>
              <form onSubmit={autoMessageForm.handleSubmit(onAutoMessageSubmit)} className="space-y-4">
                <FormField
                  control={autoMessageForm.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                      <div className="flex flex-col gap-1">
                        <FormLabel className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          <span>Respostas Automáticas</span>
                        </FormLabel>
                        <FormDescription>
                          Responde automaticamente conforme seu status
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="p-3 border rounded-lg space-y-4">
                  <FormField
                    control={autoMessageForm.control}
                    name="awayMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span>Mensagem quando Ausente</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Estou temporariamente ausente. Retornarei em breve."
                            className="resize-none h-20"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={autoMessageForm.control}
                    name="busyMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span>Mensagem quando Ocupado</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Estou ocupado no momento. Responderei assim que possível."
                            className="resize-none h-20"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={autoMessageForm.control}
                    name="offlineMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <BellOff className="h-4 w-4 text-gray-500" />
                          <span>Mensagem quando Offline</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Estou offline no momento. Verei sua mensagem quando voltar."
                            className="resize-none h-20"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter className="mt-4">
                  <Button type="submit">Salvar Mensagens Automáticas</Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          {/* Tab de Foto de Perfil */}
          <TabsContent value="profile">
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div className="flex items-center justify-center flex-col gap-4">
                  {/* Área de foto ampliada */}
                  <div className="relative group">
                    <Avatar className="h-36 w-36 border-2 border-border">
                      {profileImagePreview ? (
                        <AvatarImage src={profileImagePreview} alt="Prévia da foto de perfil" />
                      ) : currentProfileImage ? (
                        <AvatarImage src={currentProfileImage} alt={user?.fullName || user?.username || "Usuário"} />
                      ) : (
                        <>
                          <AvatarFallback className="text-4xl">
                            {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    {/* Overlay para sugerir a troca de foto ao passar o mouse */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                      <FileImage className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-2">
                      <Label htmlFor="picture" className="cursor-pointer text-center">
                        <div className="inline-flex items-center justify-center px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium gap-2">
                          <FileImage className="h-4 w-4" />
                          <span>Selecionar Imagem</span>
                        </div>
                        <Input 
                          id="picture" 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileChange}
                          className="hidden" 
                        />
                      </Label>
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9"
                        onClick={() => {
                          // Função para gerar um avatar aleatório baseado no nome do usuário
                          const generateAvatar = () => {
                            const username = user?.username || 'user';
                            const colors = [
                              'ff5733', '33ff57', '3357ff', 'f333ff', 'ff33a6',
                              'a6ff33', '33ffa6', 'ffcc33', '33ccff', 'ff33cc'
                            ];
                            
                            // Usar nome do usuário para selecionar uma cor
                            const colorIndex = username.length % colors.length;
                            const color = colors[colorIndex];
                            
                            // Criar avatar com as iniciais e cor de fundo
                            const initials = (user?.fullName || user?.username || 'U').charAt(0).toUpperCase();
                            
                            // URL para o avatar (usando APIs de avatar)
                            const avatarURL = `https://ui-avatars.com/api/?name=${initials}&background=${color}&color=fff&size=256`;
                            
                            setProfileImagePreview(avatarURL);
                            
                            // Converter a URL para um arquivo Blob para o formulário
                            fetch(avatarURL)
                              .then(response => response.blob())
                              .then(blob => {
                                const file = new File([blob], `avatar-${username}.png`, { type: 'image/png' });
                                profileForm.setValue("profileImage", file);
                              })
                              .catch(error => {
                                console.error("Erro ao gerar avatar:", error);
                                toast({
                                  title: "Erro",
                                  description: "Não foi possível gerar o avatar. Tente novamente.",
                                  variant: "destructive"
                                });
                              });
                          };
                          
                          generateAvatar();
                        }}
                      >
                        <SmilePlus className="h-4 w-4 mr-1" />
                        <span>Gerar Avatar</span>
                      </Button>
                    </div>
                    
                    {profileImagePreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProfileImagePreview(null);
                          profileForm.setValue("profileImage", undefined);
                        }}
                        className="h-8"
                      >
                        <X className="h-4 w-4 mr-1" />
                        <span>Remover</span>
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground text-center">
                  <p>Formatos aceitos: JPEG, PNG e GIF</p>
                  <p>Tamanho máximo: 5MB</p>
                </div>
                
                <DialogFooter className="mt-4">
                  <Button 
                    type="submit" 
                    disabled={!profileForm.formState.isDirty && !currentProfileImage}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Atualizar Foto de Perfil</span>
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}