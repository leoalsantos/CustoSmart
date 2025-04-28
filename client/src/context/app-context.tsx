import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Definição dos tipos
export interface Alert {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  dismissed: boolean;
}

export interface AppState {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  alerts: Alert[];
  settings: {
    language: 'pt_BR' | 'en_US';
    notificationsEnabled: boolean;
    autoSave: boolean;
    compactView: boolean;
  };
}

// Estado inicial
const initialState: AppState = {
  darkMode: false,
  sidebarCollapsed: false,
  alerts: [],
  settings: {
    language: 'pt_BR',
    notificationsEnabled: true,
    autoSave: true,
    compactView: false,
  },
};

// Tipos de ações
type Action =
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'ADD_ALERT'; payload: Omit<Alert, 'id' | 'dismissed'> }
  | { type: 'DISMISS_ALERT'; payload: number }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> };

// Reducer
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'TOGGLE_DARK_MODE':
      return {
        ...state,
        darkMode: !state.darkMode,
      };
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      };
    case 'ADD_ALERT':
      const newAlert: Alert = {
        id: Date.now(),
        ...action.payload,
        dismissed: false,
      };
      return {
        ...state,
        alerts: [...state.alerts, newAlert],
      };
    case 'DISMISS_ALERT':
      return {
        ...state,
        alerts: state.alerts.map((alert) =>
          alert.id === action.payload ? { ...alert, dismissed: true } : alert
        ),
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    default:
      return state;
  }
}

// Criação do Context
interface AppContextType {
  state: AppState;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  addAlert: (alert: Omit<Alert, 'id' | 'dismissed'>) => void;
  dismissAlert: (id: number) => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const toggleDarkMode = () => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
    // Aplicar classe ao documento
    document.documentElement.classList.toggle('dark', !state.darkMode);
  };

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  const addAlert = (alert: Omit<Alert, 'id' | 'dismissed'>) => {
    dispatch({ type: 'ADD_ALERT', payload: alert });
  };

  const dismissAlert = (id: number) => {
    dispatch({ type: 'DISMISS_ALERT', payload: id });
  };

  const updateSettings = (settings: Partial<AppState['settings']>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  // Inicialização - aplicar o modo escuro se ativo
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode);
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        toggleDarkMode,
        toggleSidebar,
        addAlert,
        dismissAlert,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext deve ser usado dentro de um AppProvider');
  }
  return context;
};