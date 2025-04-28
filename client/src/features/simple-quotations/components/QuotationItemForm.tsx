import React from 'react';
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
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { RawMaterial, MeasurementUnit } from '@shared/schema';

interface ItemFormData {
  materialId: string;
  quantity: string;
  unitId: string;
  description: string;
  originalUnitType: string;
}

interface QuotationItemFormProps {
  itemForm: ItemFormData;
  materials: RawMaterial[] | undefined;
  units: MeasurementUnit[] | undefined;
  selectedMaterial: RawMaterial | null;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string, formSetter: React.Dispatch<React.SetStateAction<any>>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  setItemForm: React.Dispatch<React.SetStateAction<ItemFormData>>;
  isLoading: boolean;
  onCancel: () => void;
}

export const QuotationItemForm: React.FC<QuotationItemFormProps> = ({
  itemForm,
  materials,
  units,
  selectedMaterial,
  handleInputChange,
  handleSelectChange,
  handleSubmit,
  setItemForm,
  isLoading,
  onCancel,
}) => {
  // Filtrar as unidades pelo tipo da unidade original do material
  const filteredUnits = units?.filter(unit => unit.type === itemForm.originalUnitType) || [];

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Adicionar Item à Cotação</DialogTitle>
        <DialogDescription>
          Adicione um item de matéria-prima para solicitar cotações aos fornecedores.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="materialId" className="text-right">
            Matéria-Prima
          </Label>
          <div className="col-span-3">
            <Select 
              value={itemForm.materialId}
              onValueChange={(value) => handleSelectChange('materialId', value, setItemForm)}
            >
              <SelectTrigger id="materialId">
                <SelectValue placeholder="Selecione uma matéria-prima" />
              </SelectTrigger>
              <SelectContent>
                {materials?.map((material) => (
                  <SelectItem key={material.id} value={material.id.toString()}>
                    {material.name} ({material.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedMaterial && (
          <div className="bg-gray-50 p-3 rounded-md text-sm">
            <div><strong>Material:</strong> {selectedMaterial.name}</div>
            <div><strong>Código:</strong> {selectedMaterial.code}</div>
            <div><strong>Unidade Original:</strong> {selectedMaterial.unit}</div>
            {selectedMaterial.description && (
              <div><strong>Descrição:</strong> {selectedMaterial.description}</div>
            )}
          </div>
        )}

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="quantity" className="text-right">
            Quantidade
          </Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            step="0.01"
            min="0.01"
            value={itemForm.quantity}
            onChange={handleInputChange}
            className="col-span-3"
            required
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="unitId" className="text-right">
            Unidade de Medida
          </Label>
          <div className="col-span-3">
            <Select 
              value={itemForm.unitId}
              onValueChange={(value) => handleSelectChange('unitId', value, setItemForm)}
              disabled={!itemForm.materialId || filteredUnits.length === 0}
            >
              <SelectTrigger id="unitId">
                <SelectValue placeholder="Selecione uma unidade" />
              </SelectTrigger>
              <SelectContent>
                {filteredUnits.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id.toString()}>
                    {unit.name} ({unit.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {itemForm.materialId && filteredUnits.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                Não há unidades de medida compatíveis disponíveis.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            Observações
          </Label>
          <Textarea
            id="description"
            name="description"
            value={itemForm.description}
            onChange={handleInputChange}
            placeholder="Especificações adicionais ou requisitos especiais"
            className="col-span-3"
          />
        </div>
      </div>

      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !itemForm.materialId || !itemForm.quantity || !itemForm.unitId}
        >
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
  );
};