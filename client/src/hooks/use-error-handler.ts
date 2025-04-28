import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Mapeia códigos de erro HTTP para mensagens amigáveis em português
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Requisição inválida. Verifique os dados enviados.',
  401: 'Autenticação necessária. Faça login novamente.',
  403: 'Acesso negado. Você não tem permissão para esta ação.',
  404: 'Recurso não encontrado.',
  409: 'Conflito ao processar a solicitação.',
  422: 'Não foi possível processar os dados enviados.',
  429: 'Muitas requisições. Tente novamente mais tarde.',
  500: 'Erro interno do servidor. Tente novamente mais tarde.',
  502: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
  503: 'Serviço indisponível. Tente novamente mais tarde.',
  504: 'Tempo de resposta excedido. Tente novamente mais tarde.'
};

// Mapeia tipos específicos de erro para mensagens amigáveis
const ERROR_TYPE_MESSAGES: Record<string, string> = {
  'ValidationError': 'Dados inválidos ou incompletos.',
  'AuthenticationError': 'Falha na autenticação. Verifique suas credenciais.',
  'AuthorizationError': 'Você não tem permissão para esta ação.',
  'NotFoundError': 'O recurso solicitado não foi encontrado.',
  'DatabaseError': 'Erro no banco de dados. Tente novamente.',
  'NetworkError': 'Erro de conexão. Verifique sua internet.',
  'TimeoutError': 'A solicitação excedeu o tempo limite. Tente novamente.',
  'RateLimitError': 'Limite de requisições excedido. Tente novamente mais tarde.',
};

/**
 * Hook para gerenciar e exibir erros de forma padronizada
 */
export function useErrorHandler() {
  const { toast } = useToast();
  const [error, setError] = useState<ErrorState>({ hasError: false, message: '' });

  /**
   * Converte um erro do Response para um objeto ErrorResponse
   */
  const parseResponseError = useCallback(async (response: Response): Promise<ErrorResponse> => {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return {
          message: data.message || HTTP_ERROR_MESSAGES[response.status] || 'Erro desconhecido',
          code: data.code || `HTTP-${response.status}`,
          details: data.details || data.errors || undefined,
        };
      } else {
        const text = await response.text();
        return {
          message: text || HTTP_ERROR_MESSAGES[response.status] || 'Erro desconhecido',
          code: `HTTP-${response.status}`,
        };
      }
    } catch (e) {
      return {
        message: HTTP_ERROR_MESSAGES[response.status] || `Erro HTTP ${response.status}`,
        code: `HTTP-${response.status}`,
      };
    }
  }, []);

  /**
   * Exibe uma notificação toast com o erro
   */
  const showErrorToast = useCallback((message: string, description?: string) => {
    toast({
      title: message,
      description: description,
      variant: "destructive",
    });
  }, [toast]);

  /**
   * Processa e gerencia um erro de API
   */
  const handleApiError = useCallback(async (error: any): Promise<ErrorState> => {
    let errorState: ErrorState = { hasError: true, message: 'Ocorreu um erro desconhecido.' };

    // Erros de Response (fetch API)
    if (error instanceof Response) {
      const parsedError = await parseResponseError(error);
      errorState = {
        hasError: true,
        message: parsedError.message,
        code: parsedError.code,
        details: parsedError.details,
      };
      showErrorToast(parsedError.message);
    }
    // Erros com código HTTP (Axios ou similar)
    else if (error.response) {
      const statusCode = error.response.status;
      const data = error.response.data;
      
      errorState = {
        hasError: true,
        message: data?.message || HTTP_ERROR_MESSAGES[statusCode] || `Erro HTTP ${statusCode}`,
        code: data?.code || `HTTP-${statusCode}`,
        details: data?.details || data?.errors,
      };
      showErrorToast(errorState.message);
    }
    // Erros com mensagem (Error ou similar)
    else if (error.message) {
      // Verifica se o erro tem um tipo específico
      const errorType = error.name || error.type;
      const typeMessage = errorType && ERROR_TYPE_MESSAGES[errorType];
      
      errorState = {
        hasError: true,
        message: typeMessage || error.message,
        code: errorType || 'ERROR',
        details: error.details,
      };
      showErrorToast(errorState.message, error.details ? JSON.stringify(error.details) : undefined);
    }
    // Erros padrão
    else {
      errorState = {
        hasError: true,
        message: 'Ocorreu um erro desconhecido.',
        code: 'UNKNOWN',
      };
      showErrorToast(errorState.message);
    }

    setError(errorState);
    return errorState;
  }, [parseResponseError, showErrorToast]);

  /**
   * Limpa o estado de erro
   */
  const clearError = useCallback(() => {
    setError({ hasError: false, message: '' });
  }, []);

  return {
    error,
    handleApiError,
    clearError,
    showErrorToast,
  };
}