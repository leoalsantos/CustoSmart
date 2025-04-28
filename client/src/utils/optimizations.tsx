import React, { memo, useMemo, useCallback } from 'react';

/**
 * Utilitário para criar versões memoizadas de componentes
 * @param Component Componente a ser memoizado
 * @param propsAreEqual Função opcional para comparação personalizada de props
 */
export function memoizeComponent<T>(
  Component: React.ComponentType<T>,
  propsAreEqual?: (prevProps: Readonly<T>, nextProps: Readonly<T>) => boolean
): React.MemoExoticComponent<React.ComponentType<T>> {
  return memo(Component, propsAreEqual);
}

/**
 * Compara se duas arrays são iguais pelos seus valores
 */
export function areArraysEqual<T>(arr1: T[] | undefined, arr2: T[] | undefined): boolean {
  if (!arr1 && !arr2) return true;
  if (!arr1 || !arr2) return false;
  if (arr1.length !== arr2.length) return false;
  
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  
  return true;
}

/**
 * Compara se dois objetos são iguais superficialmente
 */
export function areObjectsEqual<T extends Record<string, any>>(
  obj1: T | undefined, 
  obj2: T | undefined
): boolean {
  if (!obj1 && !obj2) return true;
  if (!obj1 || !obj2) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  
  return true;
}

/**
 * Hook para memoizar uma função que retorna uma lista filtrada
 */
export function useMemoizedFilter<T>(
  items: T[] | undefined, 
  filterFn: (item: T) => boolean,
  deps: React.DependencyList = []
): T[] {
  return useMemo(() => {
    if (!items) return [];
    return items.filter(filterFn);
  }, [items, ...deps]);
}

/**
 * Hook para memoizar uma função que mapeia uma lista
 */
export function useMemoizedMap<T, R>(
  items: T[] | undefined, 
  mapFn: (item: T) => R,
  deps: React.DependencyList = []
): R[] {
  return useMemo(() => {
    if (!items) return [];
    return items.map(mapFn);
  }, [items, ...deps]);
}

/**
 * Hook para memoizar uma função que ordena uma lista
 */
export function useMemoizedSort<T>(
  items: T[] | undefined, 
  sortFn: (a: T, b: T) => number,
  deps: React.DependencyList = []
): T[] {
  return useMemo(() => {
    if (!items) return [];
    return [...items].sort(sortFn);
  }, [items, ...deps]);
}

/**
 * Hook para memoizar uma função de evento para evitar re-renderizações
 */
export function useMemoizedEventHandler<T extends Function>(
  handler: T, 
  deps: React.DependencyList = []
): T {
  // @ts-ignore
  return useCallback(handler, deps);
}

/**
 * Hook para memoizar a criação de um objeto
 */
export function useMemoizedObject<T extends Record<string, any>>(
  objectCreator: () => T,
  deps: React.DependencyList = []
): T {
  return useMemo(objectCreator, deps);
}

/**
 * HOC para aplicar memoização em um componente de lista
 */
export function withMemoizedListRendering<P extends { items: any[] }>(
  Component: React.ComponentType<P>,
  itemKeyExtractor: (item: any, index: number) => string | number
): React.FC<P> {
  const MemoizedComponent = (props: P) => {
    const memoizedItems = useMemo(() => {
      return props.items.map((item, index) => ({
        key: itemKeyExtractor(item, index),
        item
      }));
    }, [props.items]);
    
    return (
      <Component
        {...props}
        items={memoizedItems.map(({ item }) => item)}
      />
    );
  };
  
  return MemoizedComponent;
}