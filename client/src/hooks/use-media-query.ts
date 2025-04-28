import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Define a função que será chamada quando o estado de correspondência mudar
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Definir o estado inicial
    setMatches(mediaQuery.matches);
    
    // Adicionar listener para mudanças
    mediaQuery.addEventListener('change', handleChange);
    
    // Cleanup: remover listener quando o componente for desmontado
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);
  
  return matches;
}