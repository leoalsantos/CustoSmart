import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Supplier, RawMaterial, MeasurementUnit, Product } from '@shared/schema';

export function useSharedResources() {
  // Query para buscar fornecedores
  const { 
    data: suppliers, 
    isLoading: suppliersLoading 
  } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/suppliers");
      return await response.json();
    }
  });

  // Query para buscar matérias-primas
  const { 
    data: materials, 
    isLoading: materialsLoading 
  } = useQuery<RawMaterial[]>({
    queryKey: ["/api/raw-materials"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/raw-materials");
      return await response.json();
    }
  });

  // Query para buscar unidades de medida
  const { 
    data: units, 
    isLoading: unitsLoading 
  } = useQuery<MeasurementUnit[]>({
    queryKey: ["/api/measurement-units"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/measurement-units");
      return await response.json();
    }
  });

  // Query para buscar produtos
  const { 
    data: products, 
    isLoading: productsLoading 
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products");
      return await response.json();
    }
  });

  return {
    suppliers,
    suppliersLoading,
    materials,
    materialsLoading,
    units,
    unitsLoading,
    products,
    productsLoading
  };
}