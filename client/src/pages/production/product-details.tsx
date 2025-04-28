import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Pencil, Trash } from "lucide-react";
import { Link } from "wouter";

export default function ProductDetails() {
  const { id } = useParams();
  const { toast } = useToast();
  
  // Buscar detalhes do produto
  const { data: product, isLoading } = useQuery({
    queryKey: ["/api/products", id],
    queryFn: async () => {
      // Simulamos os dados para fins de demonstração
      return {
        id: parseInt(id as string),
        name: "Produto FL-300",
        code: "FL-300",
        description: "Fluxo de alta viscosidade para componentes eletrônicos",
        unitCost: 125.50,
        sellingPrice: 199.99,
        formula: [
          { materialId: 1, materialName: "Base Química A23", quantity: 0.350, unit: "kg" },
          { materialId: 2, materialName: "Catalisador B12", quantity: 0.075, unit: "kg" },
          { materialId: 3, materialName: "Pigmento P45", quantity: 0.025, unit: "kg" },
          { materialId: 4, materialName: "Aditivo de Fluidez", quantity: 0.015, unit: "kg" }
        ]
      };
    }
  });

  // Função para excluir o produto
  const handleDelete = () => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      // Aqui seria implementada a chamada para excluir o produto
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso",
      });
      // Redirecionar para a lista de produtos
      window.history.back();
    }
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
    );
  }

  if (!product) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            O produto que você está procurando não existe ou foi removido.
          </p>
          <Link href="/production/products">
            <Button>Voltar para Lista de Produtos</Button>
          </Link>
        </div>
    );
  }

  return (
      <div className="container mx-auto py-10">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <Badge>{product.code}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Informações do Produto</CardTitle>
              <CardDescription>Detalhes e custos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Código</h3>
                <p>{product.code}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Descrição</h3>
                <p>{product.description}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Custo Unitário</h3>
                <p className="text-lg font-semibold">R$ {product.unitCost.toFixed(2)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Preço de Venda</h3>
                <p className="text-lg font-semibold">R$ {product.sellingPrice.toFixed(2)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Margem</h3>
                <p className="text-lg font-semibold">
                  {(((product.sellingPrice - product.unitCost) / product.unitCost) * 100).toFixed(2)}%
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href={`/production/product/${id}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </CardFooter>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Fórmula</CardTitle>
              <CardDescription>Materiais e quantidades</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-center">Unidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.formula.map((item) => (
                    <TableRow key={item.materialId}>
                      <TableCell className="font-medium">{item.materialName}</TableCell>
                      <TableCell className="text-right">{item.quantity.toFixed(4)}</TableCell>
                      <TableCell className="text-center">{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}