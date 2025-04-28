import { useState } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Loader2, Search, PackageOpen } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const InventoryProducts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [movementAmount, setMovementAmount] = useState("");
  
  // Query for finished products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });
  
  // Query for production orders to calculate available stock
  const { data: productionOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/production-orders"],
  });
  
  // Query for orders (sales) to calculate reserved stock
  const { data: salesOrders, isLoading: salesLoading } = useQuery({
    queryKey: ["/api/orders"],
  });
  
  // Calculate inventory levels for each product
  const productInventory = products?.map((product: any) => {
    // Get completed production orders for this product
    const completedOrders = productionOrders?.filter(
      (order: any) => order.productId === product.id && order.status === "completed"
    ) || [];
    
    // Calculate total produced quantity
    const totalProduced = completedOrders.reduce(
      (sum: number, order: any) => sum + order.quantity, 0
    );
    
    // Get sales orders for this product
    const salesForProduct = salesOrders?.filter((order: any) => {
      const orderItems = order.items || [];
      return orderItems.some((item: any) => item.productId === product.id);
    }) || [];
    
    // Calculate total sold quantity
    const totalSold = salesForProduct.reduce((sum: number, order: any) => {
      const orderItems = order.items || [];
      const productItems = orderItems.filter((item: any) => item.productId === product.id);
      return sum + productItems.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0);
    }, 0);
    
    // Calculate current stock
    const currentStock = totalProduced - totalSold;
    
    return {
      ...product,
      producedQuantity: totalProduced,
      soldQuantity: totalSold,
      currentStock: currentStock,
    };
  }) || [];
  
  // Filter products by search term
  const filteredProducts = productInventory?.filter((product: any) => {
    const searchString = `${product.name} ${product.code}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  }) || [];
  
  // Calculate statistics
  const totalProducts = productInventory?.length || 0;
  const lowStockProducts = productInventory?.filter((p: any) => p.currentStock < 10).length || 0;
  const outOfStockProducts = productInventory?.filter((p: any) => p.currentStock <= 0).length || 0;
  
  // Column definition for products table
  const columns = [
    {
      header: "Código",
      accessorKey: "code",
    },
    {
      header: "Produto",
      accessorKey: "name",
    },
    {
      header: "Estoque Atual",
      accessorKey: "currentStock",
      cell: (row: any) => {
        return row.currentStock >= 0 ? row.currentStock : 0;
      }
    },
    {
      header: "Produzido",
      accessorKey: "producedQuantity",
    },
    {
      header: "Vendido",
      accessorKey: "soldQuantity",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: any) => {
        const stock = row.currentStock;
        let statusType, statusText;
        
        if (stock <= 0) {
          statusType = 'outOfStock';
          statusText = 'Sem estoque';
        } else if (stock < 10) {
          statusType = 'lowStock';
          statusText = 'Estoque baixo';
        } else {
          statusType = 'inStock';
          statusText = 'Em estoque';
        }
        
        const statusClasses = {
          'outOfStock': 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900',
          'lowStock': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900',
          'inStock': 'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900'
        };
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[statusType]}`}>
            {statusText}
          </span>
        );
      }
    },
    {
      header: "Preço Unitário",
      accessorKey: "sellingPrice",
      cell: (row: any) => {
        if (!row.sellingPrice) return "-";
        return new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(row.sellingPrice);
      }
    },
  ];
  
  // Action column
  const actionColumn = {
    cell: (row: any) => (
      <div className="flex gap-2">
        <Link 
          href={`/production/products/${row.id}`}
          className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
        >
          Detalhes
        </Link>
      </div>
    ),
  };
  
  const isLoading = productsLoading || ordersLoading || salesLoading;
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Produtos Acabados</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie o estoque de produtos acabados da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton 
            data={productInventory || []}
            filename="produtos-acabados"
            label="Exportar"
            pdfTitle="Relatório de Produtos Acabados"
            pdfSubtitle="Relatório gerado pelo CustoSmart"
            variant="outline"
            size="sm"
          />
          <Link href="/production/products">
            <Button size="sm">
              <PackageOpen className="mr-2 h-4 w-4" />
              Gerenciar Produtos
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockProducts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Sem Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockProducts}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input 
          placeholder="Buscar produtos..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Products table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        actionColumn={actionColumn}
        isLoading={isLoading}
        pagination={{
          currentPage,
          totalPages: Math.ceil((filteredProducts.length || 0) / 10),
          onPageChange: setCurrentPage
        }}
      />
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-md font-semibold text-blue-700 dark:text-blue-300 mb-2">Nota sobre o estoque</h3>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          O estoque de produtos acabados é calculado automaticamente com base nas ordens de produção concluídas e nos pedidos de venda.
          Para aumentar o estoque, crie e conclua novas ordens de produção.
        </p>
      </div>
    </>
  );
};

export default InventoryProducts;
