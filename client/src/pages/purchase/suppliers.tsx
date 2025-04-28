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
import { PlusCircle, Search, Phone, Mail, ExternalLink, Pencil } from "lucide-react";
import { Link } from "wouter";

interface Supplier {
  id: number;
  name: string;
  code: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  status: "active" | "inactive" | "pending";
  rating: number;
}

export default function PurchaseSuppliers() {
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar fornecedores
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["/api/purchase/suppliers"],
    queryFn: async () => {
      // Dados simulados
      return [
        {
          id: 1,
          name: "Química Industrial S.A.",
          code: "QUIM001",
          category: "Matérias-primas",
          contactName: "João Pereira",
          phone: "(11) 3456-7890",
          email: "joao.pereira@quimicaindustrial.com.br",
          address: "Av. Industrial, 1200, São Paulo - SP",
          status: "active" as const,
          rating: 4.8
        },
        {
          id: 2,
          name: "Embalagens Express",
          code: "EMB002",
          category: "Embalagens",
          contactName: "Maria Silva",
          phone: "(11) 2345-6789",
          email: "maria.silva@embalagensexpress.com.br",
          address: "Rua das Indústrias, 500, Guarulhos - SP",
          status: "active" as const,
          rating: 4.2
        },
        {
          id: 3,
          name: "Pigmentos e Aditivos Ltda.",
          code: "PIG003",
          category: "Matérias-primas",
          contactName: "Roberto Santos",
          phone: "(11) 9876-5432",
          email: "roberto.santos@pigmentosaditivos.com.br",
          address: "Rua Colorida, 123, Diadema - SP",
          status: "inactive" as const,
          rating: 3.5
        },
        {
          id: 4,
          name: "LogTrans Transportes",
          code: "LOG004",
          category: "Transportes",
          contactName: "Ana Oliveira",
          phone: "(11) 8765-4321",
          email: "ana.oliveira@logtrans.com.br",
          address: "Rodovia dos Transportadores, km 10, Campinas - SP",
          status: "active" as const,
          rating: 4.0
        },
        {
          id: 5,
          name: "Global Chemicals Co.",
          code: "GCC005",
          category: "Matérias-primas",
          contactName: "Pedro Mendes",
          phone: "(11) 5678-9012",
          email: "pedro.mendes@globalchemicals.com",
          address: "Av. Internacional, 789, São Bernardo do Campo - SP",
          status: "pending" as const,
          rating: 0
        },
      ] as Supplier[];
    },
  });

  // Filtrar fornecedores com base no termo de pesquisa
  const filteredSuppliers = suppliers?.filter((supplier) => {
    return (
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Função para obter a cor do badge de status
  const getStatusBadge = (status: "active" | "inactive" | "pending") => {
    switch (status) {
      case "active":
        return { label: "Ativo", variant: "default" };
      case "inactive":
        return { label: "Inativo", variant: "secondary" };
      case "pending":
        return { label: "Pendente", variant: "outline" };
      default:
        return { label: status, variant: "default" };
    }
  };

  // Função para renderizar estrelas de avaliação
  const renderRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center">
        {Array(fullStars).fill(0).map((_, i) => (
          <svg key={`full-${i}`} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
        ))}
        
        {hasHalfStar && (
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
        )}
        
        {Array(emptyStars).fill(0).map((_, i) => (
          <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
        ))}
        
        {rating > 0 && (
          <span className="ml-1 text-sm text-gray-500">{rating.toFixed(1)}</span>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Fornecedores</h1>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Fornecedor
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Buscar Fornecedores</CardTitle>
            <CardDescription>
              Pesquise por nome, código, categoria ou contato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fornecedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Fornecedores</CardTitle>
            <CardDescription>
              {filteredSuppliers?.length || 0} fornecedores encontrados
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
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Avaliação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers && filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          {supplier.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {supplier.name}
                        </TableCell>
                        <TableCell>
                          {supplier.category}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{supplier.contactName}</span>
                            <div className="flex items-center gap-4 mt-1">
                              <a href={`mailto:${supplier.email}`} className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary">
                                <Mail className="h-3 w-3" />
                                <span className="hidden md:inline">Email</span>
                              </a>
                              <a href={`tel:${supplier.phone}`} className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary">
                                <Phone className="h-3 w-3" />
                                <span className="hidden md:inline">Telefone</span>
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(supplier.status).variant as any}>
                            {getStatusBadge(supplier.status).label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {renderRating(supplier.rating)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/purchase/suppliers/${supplier.id}`}>
                                <ExternalLink className="h-4 w-4" />
                                <span className="sr-only">Ver detalhes</span>
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/purchase/suppliers/${supplier.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        Nenhum fornecedor encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}