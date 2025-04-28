import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export interface ExportButtonProps {
  data: any[];
  filename: string;
  label?: string;
  pdfTitle?: string;
  pdfSubtitle?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExportButton({ 
  data, 
  filename, 
  label = 'Exportar', 
  variant = 'outline',
  size = 'default'
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Exportar para Excel
  const exportToExcel = () => {
    try {
      setIsExporting(true);
      
      // Criar uma planilha
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
      
      // Gerar arquivo
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Salvar arquivo
      saveAs(fileData, `${filename}.xlsx`);
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      disabled={isExporting} 
      className="flex items-center"
      onClick={exportToExcel}
    >
      {isExporting ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Exportando...</span>
        </div>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );
}