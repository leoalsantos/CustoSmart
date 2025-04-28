import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { RawMaterial, MeasurementUnit } from '@shared/schema';

interface QuotationItemFormProps {
  itemForm: {
    materialId: string;
    quantity: string;
    unitId: string;
    description: string;
    originalUnitType: string;
  };
  selectedMaterial: RawMaterial | null;
  materials: RawMaterial[] | undefined;
  units: MeasurementUnit[] | undefined;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleMaterialSelect: (value: string) => void;
  handleUnitSelect: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  materialsLoading: boolean;
  unitsLoading: boolean;
  onCancel: () => void;
}

export function QuotationItemForm({
  itemForm,
  selectedMaterial,
  materials,
  units,
  handleInputChange,
  handleMaterialSelect,
  handleUnitSelect,
  handleSubmit,
  isLoading,
  materialsLoading,
  unitsLoading,
  onCancel,
}: QuotationItemFormProps) {
  // Filtrar unidades com base no tipo da unidade do material
  const filteredUnits = React.useMemo(() => {
    if (!units || !itemForm.originalUnitType) return [];
    
    // Se não tivermos um tipo de unidade definido, retornar todas as unidades
    if (itemForm.originalUnitType === "unit") return units;
    
    // Filtrar unidades com base no tipo
    return units.filter(unit => {
      // Classificar as unidades
      if (itemForm.originalUnitType === "weight" && ["kg", "g", "mg", "ton"].includes(unit.symbol)) {
        return true;
      } else if (itemForm.originalUnitType === "volume" && ["l", "ml", "m³", "cm³"].includes(unit.symbol)) {
        return true;
      } else if (itemForm.originalUnitType === "area" && ["m²", "cm²", "mm²"].includes(unit.symbol)) {
        return true;
      } else if (itemForm.originalUnitType === "length" && ["m", "cm", "mm", "km"].includes(unit.symbol)) {
        return true;
      }
      return false;
    });
  }, [units, itemForm.originalUnitType]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Adicionar Item à Cotação</DialogTitle>
        <DialogDescription>
          Selecione o material e a quantidade necessária para esta cotação.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="materialId">Material</Label>
            <Select
              value={itemForm.materialId}
              onValueChange={handleMaterialSelect}
              disabled={materialsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um material" />
              </SelectTrigger>
              <SelectContent>
                {materialsLoading ? (
                  <SelectItem value="loading" disabled>
                    Carregando...
                  </SelectItem>
                ) : (
                  materials?.map((material) => (
                    <SelectItem key={material.id} value={material.id.toString()}>
                      {material.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          {selectedMaterial && (
            <div className="bg-muted p-2 rounded text-sm">
              <p><strong>Material:</strong> {selectedMaterial.name}</p>
              <p><strong>Código:</strong> {selectedMaterial.code}</p>
              <p><strong>Unidade:</strong> {selectedMaterial.unit}</p>
              <p><strong>Preço Atual:</strong> R$ {selectedMaterial.price?.toFixed(2) || '0.00'}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Quantidade"
                value={itemForm.quantity}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="unitId">Unidade de Medida</Label>
              <Select
                value={itemForm.unitId}
                onValueChange={handleUnitSelect}
                disabled={unitsLoading || !itemForm.materialId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unitsLoading ? (
                    <SelectItem value="loading" disabled>
                      Carregando...
                    </SelectItem>
                  ) : (
                    filteredUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.name} ({unit.symbol})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição/Especificações</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Especificações adicionais ou requisitos"
              value={itemForm.description}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || !itemForm.materialId || !itemForm.quantity || !itemForm.unitId}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              'Adicionar Item'
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}