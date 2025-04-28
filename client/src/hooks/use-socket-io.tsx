import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export function useSocketIO(): UseSocketReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;

  // Função para criar conexão
  const connect = useCallback(() => {
    if (!user) {
      console.log('Usuário não autenticado. Não é possível conectar ao Socket.IO');
      return;
    }

    try {
      // Limpar qualquer reconexão pendente
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      // Determinar o protocolo (wss para HTTPS, ws para HTTP)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socketUrl = `${protocol}//${window.location.host}`;
      
      console.log('Conectando ao Socket.IO em:', socketUrl);
      
      // Criar nova conexão
      const socketIo = io(socketUrl, {
        path: '/socket.io',
        auth: {
          userId: user.id
        },
        reconnection: false, // Vamos gerenciar a reconexão manualmente
        withCredentials: true
      });

      // Configurar eventos
      socketIo.on('connect', () => {
        console.log('Conectado ao Socket.IO');
        setConnected(true);
        reconnectAttemptsRef.current = 0; // Resetar tentativas ao conectar com sucesso
      });

      socketIo.on('disconnect', () => {
        console.log('Desconectado do Socket.IO');
        setConnected(false);
        
        // Tentar reconectar automaticamente
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            console.log(`Tentativa de reconexão ${reconnectAttemptsRef.current} de ${MAX_RECONNECT_ATTEMPTS}`);
            connect();
          }, RECONNECT_DELAY);
        } else {
          toast({
            title: "Erro de conexão",
            description: "Não foi possível restabelecer a conexão com o chat.",
            variant: "destructive"
          });
        }
      });

      socketIo.on('error', (error) => {
        console.error('Erro no Socket.IO:', error);
        toast({
          title: "Erro no chat",
          description: "Ocorreu um erro na conexão com o chat.",
          variant: "destructive"
        });
      });

      // Armazenar a instância do socket
      setSocket(socketIo);
      
      // Limpar socket ao desmontar
      return () => {
        socketIo.disconnect();
        setSocket(null);
        setConnected(false);
      };
    } catch (error) {
      console.error('Erro ao configurar Socket.IO:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível estabelecer conexão com o chat.",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // Função para desconectar
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    }
    
    // Limpar qualquer tentativa de reconexão pendente
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    reconnectAttemptsRef.current = 0;
  }, [socket]);

  // Conectar quando o componente montar e o usuário estiver autenticado
  useEffect(() => {
    if (user && !socket) {
      connect();
    }
    
    // Limpar conexão ao desmontar
    return () => {
      disconnect();
    };
  }, [user, connect, disconnect, socket]);

  return {
    socket,
    connected,
    connect,
    disconnect
  };
}