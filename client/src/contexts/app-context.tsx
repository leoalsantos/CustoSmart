import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Definindo os tipos para o estado global
export interface AppState {
  auth: {
    isAuthenticated: boolean;
    user: {
      id?: number;
      username?: string;
      fullName?: string;
      photoUrl?: string;
      role?: string;
    };
  };
  ui: {
    sidebarOpen: boolean;
    currentTheme: 'light' | 'dark' | 'system';
    notifications: Array<{
      id: string;
      type: 'info' | 'success' | 'warning' | 'error';
      message: string;
      seen: boolean;
    }>;
  };
  settings: {
    language: string;
    dateFormat: string;
    currencyFormat: string;
  };
}

// Estado inicial
const initialState: AppState = {
  auth: {
    isAuthenticated: false,
    user: {},
  },
  ui: {
    sidebarOpen: true,
    currentTheme: 'light',
    notifications: [],
  },
  settings: {
    language: 'pt-BR',
    dateFormat: 'dd/MM/yyyy',
    currencyFormat: 'BRL',
  },
};

// Definindo os tipos para as ações
type AuthAction =
  | { type: 'LOGIN'; payload: { user: AppState['auth']['user'] } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: { user: Partial<AppState['auth']['user']> } };

type UIAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_THEME'; payload: { theme: 'light' | 'dark' | 'system' } }
  | { type: 'ADD_NOTIFICATION'; payload: { notification: Omit<AppState['ui']['notifications'][0], 'id' | 'seen'> } }
  | { type: 'MARK_NOTIFICATION_SEEN'; payload: { id: string } }
  | { type: 'REMOVE_NOTIFICATION'; payload: { id: string } };

type SettingsAction =
  | { type: 'SET_LANGUAGE'; payload: { language: string } }
  | { type: 'SET_DATE_FORMAT'; payload: { dateFormat: string } }
  | { type: 'SET_CURRENCY_FORMAT'; payload: { currencyFormat: string } };

type AppAction = AuthAction | UIAction | SettingsAction;

// Criando o reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // Auth actions
    case 'LOGIN':
      return {
        ...state,
        auth: {
          isAuthenticated: true,
          user: action.payload.user,
        },
      };
    case 'LOGOUT':
      return {
        ...state,
        auth: {
          isAuthenticated: false,
          user: {},
        },
      };
    case 'UPDATE_USER':
      return {
        ...state,
        auth: {
          ...state.auth,
          user: {
            ...state.auth.user,
            ...action.payload.user,
          },
        },
      };

    // UI actions
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarOpen: !state.ui.sidebarOpen,
        },
      };
    case 'SET_THEME':
      return {
        ...state,
        ui: {
          ...state.ui,
          currentTheme: action.payload.theme,
        },
      };
    case 'ADD_NOTIFICATION':
      const newNotification = {
        id: Date.now().toString(),
        ...action.payload.notification,
        seen: false,
      };
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [...state.ui.notifications, newNotification],
        },
      };
    case 'MARK_NOTIFICATION_SEEN':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.map((notification) =>
            notification.id === action.payload.id
              ? { ...notification, seen: true }
              : notification
          ),
        },
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(
            (notification) => notification.id !== action.payload.id
          ),
        },
      };

    // Settings actions
    case 'SET_LANGUAGE':
      return {
        ...state,
        settings: {
          ...state.settings,
          language: action.payload.language,
        },
      };
    case 'SET_DATE_FORMAT':
      return {
        ...state,
        settings: {
          ...state.settings,
          dateFormat: action.payload.dateFormat,
        },
      };
    case 'SET_CURRENCY_FORMAT':
      return {
        ...state,
        settings: {
          ...state.settings,
          currencyFormat: action.payload.currencyFormat,
        },
      };

    default:
      return state;
  }
}

// Criando o contexto
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider para o contexto
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Hooks auxiliares para cada seção do estado
export function useAuth() {
  const { state, dispatch } = useAppContext();
  
  return {
    auth: state.auth,
    login: (user: AppState['auth']['user']) => {
      dispatch({ type: 'LOGIN', payload: { user } });
    },
    logout: () => {
      dispatch({ type: 'LOGOUT' });
    },
    updateUser: (user: Partial<AppState['auth']['user']>) => {
      dispatch({ type: 'UPDATE_USER', payload: { user } });
    },
  };
}

export function useUI() {
  const { state, dispatch } = useAppContext();
  
  return {
    ui: state.ui,
    toggleSidebar: () => {
      dispatch({ type: 'TOGGLE_SIDEBAR' });
    },
    setTheme: (theme: 'light' | 'dark' | 'system') => {
      dispatch({ type: 'SET_THEME', payload: { theme } });
    },
    addNotification: (notification: Omit<AppState['ui']['notifications'][0], 'id' | 'seen'>) => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { notification } });
    },
    markNotificationSeen: (id: string) => {
      dispatch({ type: 'MARK_NOTIFICATION_SEEN', payload: { id } });
    },
    removeNotification: (id: string) => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: { id } });
    },
  };
}

export function useSettings() {
  const { state, dispatch } = useAppContext();
  
  return {
    settings: state.settings,
    setLanguage: (language: string) => {
      dispatch({ type: 'SET_LANGUAGE', payload: { language } });
    },
    setDateFormat: (dateFormat: string) => {
      dispatch({ type: 'SET_DATE_FORMAT', payload: { dateFormat } });
    },
    setCurrencyFormat: (currencyFormat: string) => {
      dispatch({ type: 'SET_CURRENCY_FORMAT', payload: { currencyFormat } });
    },
  };
}