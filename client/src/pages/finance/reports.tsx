import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { addDays, format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function FinanceReports() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const [categoryFilter, setCategoryFilter] = useState("all");

  // Simulando dados financeiros
  const { data: financeData, isLoading } = useQuery({
    queryKey: [
      "/api/finance/reports",
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
    ],
    queryFn: async () => {
      // Em um caso real, isso seria uma chamada à API
      // O melhor para o caso é simular dados para garantir visualização
      return {
        expenses: [
          { category: "Matéria-Prima", amount: 15000, month: "01" },
          { category: "Matéria-Prima", amount: 18000, month: "02" },
          { category: "Matéria-Prima", amount: 16500, month: "03" },
          { category: "Matéria-Prima", amount: 17200, month: "04" },
          { category: "Salários", amount: 22000, month: "01" },
          { category: "Salários", amount: 22000, month: "02" },
          { category: "Salários", amount: 23500, month: "03" },
          { category: "Salários", amount: 23500, month: "04" },
          { category: "Energia", amount: 4500, month: "01" },
          { category: "Energia", amount: 4800, month: "02" },
          { category: "Energia", amount: 5100, month: "03" },
          { category: "Energia", amount: 4900, month: "04" },
          { category: "Manutenção", amount: 3600, month: "01" },
          { category: "Manutenção", amount: 2800, month: "02" },
          { category: "Manutenção", amount: 5200, month: "03" },
          { category: "Manutenção", amount: 3200, month: "04" },
          { category: "Outros", amount: 1800, month: "01" },
          { category: "Outros", amount: 2200, month: "02" },
          { category: "Outros", amount: 1900, month: "03" },
          { category: "Outros", amount: 2100, month: "04" },
        ],
        revenue: [
          { month: "01", amount: 58000 },
          { month: "02", amount: 62000 },
          { month: "03", amount: 65000 },
          { month: "04", amount: 68000 },
        ],
      };
    },
  });

  // Processamento de dados para os gráficos
  const expensesByCategory = useMemo(() => {
    if (!financeData) return [];

    const filteredExpenses =
      categoryFilter === "all"
        ? financeData.expenses
        : financeData.expenses.filter((exp) => exp.category === categoryFilter);

    const groupedData = filteredExpenses.reduce(
      (acc, curr) => {
        const existing = acc.find((item) => item.category === curr.category);
        if (existing) {
          existing.amount += curr.amount;
        } else {
          acc.push({ category: curr.category, amount: curr.amount });
        }
        return acc;
      },
      [] as { category: string; amount: number }[],
    );

    return groupedData;
  }, [financeData, categoryFilter]);

  const monthlyComparisonData = useMemo(() => {
    if (!financeData) return [];

    const months = ["01", "02", "03", "04"];
    return months.map((month) => {
      const monthExpenses = financeData.expenses
        .filter((exp) => exp.month === month)
        .reduce((sum, exp) => sum + exp.amount, 0);

      const monthRevenue =
        financeData.revenue.find((rev) => rev.month === month)?.amount || 0;

      return {
        month: format(new Date(2025, parseInt(month) - 1, 1), "MMM", {
          locale: ptBR,
        }),
        despesas: monthExpenses,
        receitas: monthRevenue,
        lucro: monthRevenue - monthExpenses,
      };
    });
  }, [financeData]);

  const categories = useMemo(() => {
    if (!financeData) return [];
    return [...new Set(financeData.expenses.map((exp) => exp.category))];
  }, [financeData]);

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Relatórios Financeiros</h1>
          <div className="flex flex-col md:flex-row gap-4">
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onFromChange={(date) =>
                setDateRange((prev) => ({ ...prev, from: date }))
              }
              onToChange={(date) =>
                setDateRange((prev) => ({ ...prev, to: date }))
              }
            />
            <Button>Gerar Relatório</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Total de Despesas</CardTitle>
              <CardDescription>Período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading
                  ? "Carregando..."
                  : `R$ ${financeData?.expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString("pt-BR")}`}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Total de Receitas</CardTitle>
              <CardDescription>Período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading
                  ? "Carregando..."
                  : `R$ ${financeData?.revenue.reduce((sum, rev) => sum + rev.amount, 0).toLocaleString("pt-BR")}`}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Lucro</CardTitle>
              <CardDescription>Período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading
                  ? "Carregando..."
                  : `R$ ${(
                      financeData?.revenue.reduce(
                        (sum, rev) => sum + rev.amount,
                        0,
                      ) -
                      financeData?.expenses.reduce(
                        (sum, exp) => sum + exp.amount,
                        0,
                      )
                    ).toLocaleString("pt-BR")}`}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="category">
          <TabsList className="mb-4">
            <TabsTrigger value="category">Despesas por Categoria</TabsTrigger>
            <TabsTrigger value="monthly">Comparativo Mensal</TabsTrigger>
          </TabsList>

          <TabsContent value="category">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Despesas por Categoria</CardTitle>
                    <CardDescription>
                      Visualização da distribuição de despesas
                    </CardDescription>
                  </div>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={expensesByCategory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) =>
                            `R$ ${value.toLocaleString("pt-BR")}`
                          }
                        />
                        <Legend />
                        <Bar dataKey="amount" name="Valor" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={expensesByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                          nameKey="category"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {expensesByCategory.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) =>
                            `R$ ${value.toLocaleString("pt-BR")}`
                          }
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>Comparativo Mensal</CardTitle>
                <CardDescription>Receitas x Despesas x Lucro</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) =>
                        `R$ ${value.toLocaleString("pt-BR")}`
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="receitas"
                      name="Receitas"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="despesas"
                      name="Despesas"
                      stroke="#ff7300"
                    />
                    <Line
                      type="monotone"
                      dataKey="lucro"
                      name="Lucro"
                      stroke="#82ca9d"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
