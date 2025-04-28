import React, { useState } from "react";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Filter, 
  Loader2, 
  Search 
} from "lucide-react";
import { 
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  getFilteredRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type Table as ReactTable,
} from "@tanstack/react-table";
import * as XLSX from 'xlsx';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  actionColumn?: ColumnDef<TData, TValue>;
  isLoading?: boolean;
  export?: {
    enabled: boolean;
    filename?: string;
    title?: string;
    subtitle?: string;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  actionColumn,
  isLoading = false,
  export: exportOptions,
  pagination: paginationProps,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Garantir que todas as colunas tenham ID
  const columnsWithIds = columns.map(column => {
    // Se a coluna já tiver um ID, retornar ela como está
    if (column.id) return column;
    
    // Caso contrário, gerar um ID baseado no accessorKey (se existir)
    if ('accessorKey' in column && typeof column.accessorKey === 'string') {
      return {
        ...column,
        id: column.accessorKey
      };
    }
    
    // Fallback: caso não tenha nem id nem accessorKey
    return {
      ...column,
      id: Math.random().toString(36).substring(2, 9) // ID aleatório como último recurso
    };
  });
  
  // Adiciona a coluna de ações se fornecida, garantindo que tenha ID
  const actionsColumnWithId = actionColumn 
    ? ('id' in actionColumn 
        ? actionColumn 
        : { ...actionColumn, id: 'actions' })
    : undefined;
    
  const allColumns = actionsColumnWithId
    ? [...columnsWithIds, actionsColumnWithId]
    : columnsWithIds;

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    state: {
      columnFilters,
      globalFilter,
      pagination,
    },
  });

  // Função para exportar para Excel
  const exportToExcel = () => {
    if (!exportOptions || !exportOptions.enabled) return;

    const filename = exportOptions.filename || "exported-data";
    const workbook = XLSX.utils.book_new();
    
    // Prepara os dados para exportação
    const headers = columnsWithIds.map(column => {
      const header = typeof column.header === "string" 
        ? column.header 
        : column.id;
      return header;
    });
    
    // Usar a API da tabela para obter dados formatados
    const exportRows = table.getRowModel().rows.map(row => {
      return columnsWithIds.map(column => {
        // Construir uma célula para cada coluna
        const cell = row.getVisibleCells().find(cell => cell.column.id === column.id);
        if (cell) {
          // Extrair o valor original sempre que possível
          const value = (cell.getValue() !== undefined && cell.getValue() !== null) 
            ? cell.getValue() 
            : '';
          return value;
        }
        return '';
      });
    });
    
    const exportData = [headers, ...exportRows];
    
    // Cria a planilha
    const worksheet = XLSX.utils.aoa_to_sheet(exportData);
    
    // Adiciona título e subtítulo se fornecidos
    if (exportOptions.title || exportOptions.subtitle) {
      XLSX.utils.sheet_add_aoa(worksheet, [
        [exportOptions.title || ""],
        [exportOptions.subtitle || ""],
        [""], // Linha em branco
      ], { origin: "A1" });
      
      // Ajusta a altura da linha para os títulos
      worksheet["!rows"] = [{ hpt: 30 }, { hpt: 20 }, { hpt: 10 }];
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // Efeito para sincronizar a paginação externa com a interna quando fornecida
  React.useEffect(() => {
    if (paginationProps && pagination.pageIndex !== paginationProps.currentPage - 1) {
      setPagination({
        ...pagination,
        pageIndex: paginationProps.currentPage - 1
      });
    }
  }, [paginationProps?.currentPage, pagination.pageIndex, pagination]);

  // Handler para mudanças de página personalizado
  const handlePageChange = (direction: 'prev' | 'next') => {
    if (paginationProps) {
      // Usar o handler de paginação externo
      const newPage = direction === 'prev' 
        ? Math.max(1, paginationProps.currentPage - 1)
        : Math.min(paginationProps.totalPages, paginationProps.currentPage + 1);
      
      paginationProps.onPageChange(newPage);
    } else {
      // Usar a paginação interna da tabela
      if (direction === 'prev') {
        table.previousPage();
      } else {
        table.nextPage();
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between py-4 gap-2">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {table.getAllColumns().map(column => {
                if (!column.getCanFilter()) return null;
                return (
                  <DropdownMenuItem key={column.id} className="capitalize">
                    {column.id}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {exportOptions?.enabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          )}
        </div>
      </div>
      
      <div className="border rounded-md">
        <UITable>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={allColumns.length}
                  className="h-24 text-center"
                >
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Carregando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={allColumns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </UITable>
      </div>
      
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {paginationProps ? (
            <>
              Página {paginationProps.currentPage} de {paginationProps.totalPages}
            </>
          ) : (
            <>
              Mostrando {table.getState().pagination.pageSize * table.getState().pagination.pageIndex + 1} a{" "}
              {Math.min(
                table.getState().pagination.pageSize * (table.getState().pagination.pageIndex + 1),
                table.getFilteredRowModel().rows.length
              )}{" "}
              de {table.getFilteredRowModel().rows.length} registros
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange('prev')}
            disabled={paginationProps ? paginationProps.currentPage <= 1 : !table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange('next')}
            disabled={paginationProps ? paginationProps.currentPage >= paginationProps.totalPages : !table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}