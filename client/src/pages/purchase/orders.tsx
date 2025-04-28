import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { startOfMonth, endOfMonth } from "date-fns";
import { PlusCircle, Search, Filter, Eye, FileCheck } from "lucide-react";
import { Link } from "wouter";

type PurchaseOrderStatus =
  | "draft"
  | "pending"
  | "approved"
  | "ordered"
  | "received"
  | "canceled";

interface PurchaseOrder {
  id: number;
  orderNumber: string;
  date: string;
  supplierId: number;
  supplierName: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  currency: string;
  createdBy: string;
  approvedBy?: string;
  expectedDeliveryDate?: string;
  itemCount: number;
}

export default function PurchaseOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Buscar ordens de compra
  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: [
      "/api/purchase/orders",
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      filterStatus,
    ],
    queryFn: async () => {
      // Dados simulados
      return [
        {
          id: 1,
          orderNumber: "PO-2025-001",
          date: "2025-04-01T10:00:00",
          supplierId: 1,
          supplierName: "Química Industrial S.A.",
          status: "received" as PurchaseOrderStatus,
          totalAmount: 12500.0,
          currency: "BRL",
          createdBy: "Ana Silva",
          approvedBy: "Carlos Lima",
          expectedDeliveryDate: "2025-04-10",
          itemCount: 5,
        },
        {
          id: 2,
          orderNumber: "PO-2025-002",
          date: "2025-04-05T14:30:00",
          supplierId: 2,
          supplierName: "Embalagens Express",
          status: "ordered" as PurchaseOrderStatus,
          totalAmount: 8750.5,
          currency: "BRL",
          createdBy: "Ana Silva",
          approvedBy: "Carlos Lima",
          expectedDeliveryDate: "2025-04-20",
          itemCount: 3,
        },
        {
          id: 3,
          orderNumber: "PO-2025-003",
          date: "2025-04-10T09:15:00",
          supplierId: 1,
          supplierName: "Química Industrial S.A.",
          status: "approved" as PurchaseOrderStatus,
          totalAmount: 15200.0,
          currency: "BRL",
          createdBy: "Pedro Oliveira",
          approvedBy: "Carlos Lima",
          expectedDeliveryDate: "2025-04-25",
          itemCount: 4,
        },
        {
          id: 4,
          orderNumber: "PO-2025-004",
          date: "2025-04-12T11:20:00",
          supplierId: 4,
          supplierName: "LogTrans Transportes",
          status: "pending" as PurchaseOrderStatus,
          totalAmount: 4500.0,
          currency: "BRL",
          createdBy: "Pedro Oliveira",
          itemCount: 1,
        },
        {
          id: 5,
          orderNumber: "PO-2025-005",
          date: "2025-04-14T16:45:00",
          supplierId: 5,
          supplierName: "Global Chemicals Co.",
          status: "draft" as PurchaseOrderStatus,
          totalAmount: 22800.0,
          currency: "BRL",
          createdBy: "Ana Silva",
          itemCount: 6,
        },
      ] as PurchaseOrder[];
    },
  });

  // Filtrar ordens de compra
  const filteredOrders = purchaseOrders?.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.approvedBy || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Função para obter informações sobre status da ordem de compra
  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case "draft":
        return { label: "Rascunho", variant: "outline" };
      case "pending":
        return { label: "Pendente", variant: "secondary" };
      case "approved":
        return { label: "Aprovada", variant: "default" };
      case "ordered":
        return { label: "Pedido Enviado", variant: "default" };
      case "received":
        return { label: "Recebida", variant: "default" };
      case "canceled":
        return { label: "Cancelada", variant: "destructive" };
      default:
        return { label: status, variant: "default" };
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Ordens de Compra</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Ordem de Compra
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtrar e buscar ordens de compra</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovada</SelectItem>
                  <SelectItem value="ordered">Pedido Enviado</SelectItem>
                  <SelectItem value="received">Recebida</SelectItem>
                  <SelectItem value="canceled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onFromChange={(date) =>
                setDateRange((prev) => ({ ...prev, from: date || prev.from }))
              }
              onToChange={(date) =>
                setDateRange((prev) => ({ ...prev, to: date || prev.to }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ordens de Compra</CardTitle>
          <CardDescription>
            Lista de todas as ordens de compra no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders && filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        {new Date(order.date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>{order.supplierName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadge(order.status).variant as any}
                        >
                          {getStatusBadge(order.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.itemCount}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: order.currency,
                        }).format(order.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/purchase/orders/${order.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Ver detalhes</span>
                            </Link>
                          </Button>
                          {(order.status === "draft" ||
                            order.status === "pending") && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/purchase/orders/${order.id}/edit`}>
                                <FileCheck className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Nenhuma ordem de compra encontrada para os filtros
                      selecionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
