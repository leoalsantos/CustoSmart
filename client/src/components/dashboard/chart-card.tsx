import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type ChartType = "area" | "bar" | "line" | "pie";

interface YKey {
  key: string;
  color: string;
  name: string;
}

interface ChartFilter {
  value: string;
  label: string;
}

interface ChartCardProps {
  title: string;
  description?: string;
  data: any[];
  type: ChartType;
  xKey: string;
  yKeys: YKey[];
  filters?: ChartFilter[];
  selectedFilter?: string;
  onFilterChange?: (value: string) => void;
  isLoading?: boolean;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  data,
  type,
  xKey,
  yKeys,
  filters,
  selectedFilter,
  onFilterChange,
  isLoading = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Sem dados disponíveis para exibição.
        </div>
      );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-background border border-border rounded-md p-2 shadow-md">
            <p className="text-sm font-medium">{label}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {entry.name}: {entry.value}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    switch (type) {
      case "area":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                {yKeys.map((yKey, index) => (
                  <linearGradient
                    key={yKey.key}
                    id={`color${yKey.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={yKey.color}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={yKey.color}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <XAxis dataKey={xKey} />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip content={<CustomTooltip />} />
              {yKeys.map((yKey, index) => (
                <Area
                  key={yKey.key}
                  type="monotone"
                  dataKey={yKey.key}
                  stroke={yKey.color}
                  fillOpacity={1}
                  fill={`url(#color${yKey.key})`}
                  name={yKey.name}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis dataKey={xKey} />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip content={<CustomTooltip />} />
              {yKeys.map((yKey, index) => (
                <Bar
                  key={yKey.key}
                  dataKey={yKey.key}
                  fill={yKey.color}
                  name={yKey.name}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis dataKey={xKey} />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip content={<CustomTooltip />} />
              {yKeys.map((yKey, index) => (
                <Line
                  key={yKey.key}
                  type="monotone"
                  dataKey={yKey.key}
                  stroke={yKey.color}
                  name={yKey.name}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        // For pie charts, we need to transform the data
        const pieData = useMemo(() => {
          if (!data || data.length === 0 || !yKeys || yKeys.length === 0) return [];
          
          // We'll use the first item in the data array for simplicity
          const firstDataItem = data[0];
          
          return yKeys.map(yKey => ({
            name: yKey.name,
            value: firstDataItem[yKey.key],
            color: yKey.color,
          }));
        }, [data, yKeys]);

        return (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Tipo de gráfico não suportado.
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between gap-2 sm:items-center pb-3">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {filters && filters.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {filters.map((filter) => (
              <Button
                key={filter.value}
                variant={selectedFilter === filter.value ? "secondary" : "outline"}
                size="sm"
                onClick={() => onFilterChange?.(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">{renderChart()}</CardContent>
    </Card>
  );
};