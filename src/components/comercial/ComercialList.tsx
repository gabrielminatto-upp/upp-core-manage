import React from "react";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, Filter, Search, RefreshCw, ArrowUp, ArrowDown, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkflowStatus } from "@/hooks/use-workflow-status";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";

interface ComercialItem {
  id: string;
  cliente: string;
  vendedor: string;
  produto: string;
  valor: number;
  status: string;
  data_venda: string;
  comissao: number;
  meta_mensal: number;
}

const PAGE_SIZE_OPTIONS = [1, 10, 100, "Todos"] as const;

const ComercialListComponent = function ComercialList() {
  const { toast } = useToast();
  const { addExecution, updateExecutionStatus, pendingExecutions } = useWorkflowStatus();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<"idle" | "processando" | "concluido">("idle");
  const [orderBy, setOrderBy] = useState<keyof ComercialItem>("cliente");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState<number | "Todos">(10);

  // Função para chamar o webhook
  const handleUpdate = async () => {
    setIsUpdating(true);
    setProcessingStatus("processando");

    try {
      const executionId = `update_comercial_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      addExecution(executionId);

      const response = await fetch(
        "https://integrations-crm.absolutatecnologia.com.br/webhook/comercial-update",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "update_comercial",
            execution_id: executionId,
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();

        if (result.status === "completed") {
          setProcessingStatus("concluido");
          updateExecutionStatus(executionId, "completed", result.message);
          toast({
            title: "Atualização concluída!",
            description: result.message || "Dados comerciais atualizados com sucesso.",
          });
        } else if (result.status === "failed") {
          setProcessingStatus("idle");
          updateExecutionStatus(executionId, "failed", result.message);
          toast({
            title: "Erro na atualização",
            description: result.message || "Erro ao processar dados comerciais.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Workflow iniciado!",
            description: "Processamento em andamento...",
          });
        }
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Erro ao chamar webhook:", error);
      setProcessingStatus("idle");
      toast({
        title: "Erro ao atualizar",
        description:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao chamar webhook.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Função para buscar todos os dados comerciais em lotes
  async function fetchAllComercialData() {
    const pageSize = 1000;
    let from = 0;
    let to = pageSize - 1;
    let allData: any[] = [];
    let finished = false;
    while (!finished) {
      let query = supabase.from("comercial").select("*", { count: "exact" });
      if (statusFilter) query = query.eq("status", statusFilter);
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        query = query.or(
          `cliente.ilike.%${searchLower}%,vendedor.ilike.%${searchLower}%,produto.ilike.%${searchLower}%`
        );
      }
      const { data, error } = await query.range(from, to);
      if (error) throw error;
      allData = allData.concat(data || []);
      if (!data || data.length < pageSize) finished = true;
      from += pageSize;
      to += pageSize;
    }
    return allData;
  }

  // Função para exportar todos os dados comerciais para Excel
  const handleExportExcel = async () => {
    try {
      const data = await fetchAllComercialData();
      if (!data || data.length === 0) {
        toast({
          title: "Nenhum dado encontrado para exportar.",
          variant: "destructive",
        });
        return;
      }
      
      const exportData = data.map((item: any) => ({
        Cliente: item.cliente,
        Vendedor: item.vendedor,
        Produto: item.produto,
        "Valor (R$)": item.valor,
        Status: item.status,
        "Data da Venda": item.data_venda,
        "Comissão (R$)": item.comissao,
        "Meta Mensal (R$)": item.meta_mensal,
      }));
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Comercial");
      XLSX.writeFile(wb, "dados_comerciais.xlsx");
    } catch (err: any) {
      toast({
        title: "Erro ao exportar para Excel",
        description: err?.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  // Lista de status
  const { data: statusOptions, isLoading: statusLoading } = useQuery<string[]>({
    queryKey: ["comercial_status_list"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("comercial")
        .select("status")
        .not("status", "is", null);
      if (error) throw error;
      const statusList = [...new Set((data || []).map((r: any) => r.status))];
      return statusList.filter((s): s is string => s !== null);
    },
    meta: {
      onError: (err: any) => {
        toast({
          title: "Erro ao carregar status",
          description: err?.message || "Tente novamente mais tarde.",
          variant: "destructive",
        });
      },
    },
  });

  // Estatísticas
  const { data: stats, isLoading: statsLoading } = useQuery<{
    total: number;
    vendas_fechadas: number;
    vendas_pendentes: number;
    valor_total: number;
    comissao_total: number;
  }>({
    queryKey: ["comercial_stats", statusFilter, searchTerm],
    queryFn: async (): Promise<{
      total: number;
      vendas_fechadas: number;
      vendas_pendentes: number;
      valor_total: number;
      comissao_total: number;
    }> => {
      let query = supabase.from("comercial").select("*", { count: "exact" });

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        query = query.or(
          `cliente.ilike.%${searchLower}%,vendedor.ilike.%${searchLower}%,produto.ilike.%${searchLower}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      const total = data?.length || 0;
      const vendas_fechadas = data?.filter((item: any) => item.status === "fechada").length || 0;
      const vendas_pendentes = data?.filter((item: any) => item.status === "pendente").length || 0;
      const valor_total = data?.reduce((sum: number, item: any) => sum + (item.valor || 0), 0) || 0;
      const comissao_total = data?.reduce((sum: number, item: any) => sum + (item.comissao || 0), 0) || 0;

      return {
        total,
        vendas_fechadas,
        vendas_pendentes,
        valor_total,
        comissao_total,
      };
    },
    meta: {
      onError: (err: any) => {
        toast({
          title: "Erro ao carregar métricas",
          description: err?.message || "Tente novamente mais tarde.",
          variant: "destructive",
        });
      },
    },
  });

  // Dados comerciais paginados
  const {
    data: comercialData = { rows: [], count: 0 },
    isLoading: comercialLoading,
    isFetching: comercialFetching,
  } = useQuery<{ rows: ComercialItem[]; count: number }>({
    queryKey: ["comercial", statusFilter, searchTerm, page, pageSize, orderBy, orderDir],
    queryFn: async (): Promise<{ rows: ComercialItem[]; count: number }> => {
      let from = 0;
      let to = 0;
      if (pageSize === "Todos") {
        from = 0;
        to = 99999;
      } else {
        from = (page - 1) * (pageSize as number);
        to = from + (pageSize as number) - 1;
      }
      
      let query = supabase
        .from("comercial")
        .select("*", { count: "exact" })
        .order(orderBy, { ascending: orderDir === "asc" });

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        query = query.or(
          `cliente.ilike.%${searchLower}%,vendedor.ilike.%${searchLower}%,produto.ilike.%${searchLower}%`
        );
      }

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;

      return {
        rows: (data || []) as ComercialItem[],
        count: count || 0,
      };
    },
    placeholderData: keepPreviousData,
    meta: {
      onError: (err: any) => {
        toast({
          title: "Erro ao carregar dados comerciais",
          description: err?.message || "Tente novamente mais tarde.",
          variant: "destructive",
        });
      },
    },
  });

  const totalCount = comercialData?.count ?? 0;
  const totalPages = useMemo(
    () => pageSize === "Todos" ? 1 : Math.max(1, Math.ceil(totalCount / (pageSize as number))),
    [totalCount, pageSize]
  );

  // Reseta para a primeira página quando o filtro muda
  const handleStatusChange = (value: string) => {
    setStatusFilter(value === "ALL" ? null : value);
    setPage(1);
  };

  // Função para lidar com mudanças na pesquisa
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  // Função para lidar com clique no cabeçalho
  const handleSort = (col: keyof ComercialItem) => {
    if (orderBy === col) {
      setOrderDir(orderDir === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(col);
      setOrderDir("asc");
    }
    setPage(1);
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      fechada: "default",
      pendente: "secondary",
      cancelada: "destructive",
      negociacao: "outline",
    };
    return variants[status?.toLowerCase?.()] || "outline";
  };

  // Geração simples de páginas com elipses
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    const maxToShow = 7;

    if (totalPages <= maxToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);

    return pages;
  }, [page, totalPages]);

  const showingFrom = useMemo(
    () => totalCount === 0 ? 0 : (page - 1) * (pageSize === "Todos" ? totalCount : (pageSize as number)) + 1,
    [page, totalCount, pageSize]
  );
  const showingTo = useMemo(
    () => totalCount === 0 ? 0 : Math.min(page * (pageSize === "Todos" ? totalCount : (pageSize as number)), totalCount),
    [page, totalCount, pageSize]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Comercial</h1>
          <p className="text-muted-foreground mt-1">
            Dashboard de vendas e performance comercial
          </p>
        </div>

        {/* Controles */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Botão Atualizar */}
          <Button
            onClick={handleUpdate}
            disabled={
              isUpdating ||
              pendingExecutions.length > 0 ||
              processingStatus === "processando"
            }
            className="w-full md:w-auto relative"
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                isUpdating || processingStatus === "processando"
                  ? "animate-spin"
                  : ""
              }`}
            />
            {processingStatus === "processando"
              ? "Processando..."
              : processingStatus === "concluido"
              ? "Concluído!"
              : isUpdating
              ? "Atualizando..."
              : pendingExecutions.length > 0
              ? "Processando..."
              : "Atualizar"}
            {pendingExecutions.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingExecutions.length}
              </span>
            )}
          </Button>
          
          {/* Botão Exportar para Excel */}
          <Button
            onClick={handleExportExcel}
            className="w-full md:w-auto"
            size="sm"
          >
            Exportar para Excel
          </Button>

          {/* Filtro por Status */}
          <div className="w-full md:w-[280px]">
            <label className="mb-1 block text-sm font-medium text-foreground">
              <span className="inline-flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                Filtrar por status
              </span>
            </label>
            <Select value={statusFilter ?? "ALL"} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                {statusLoading ? (
                  <div className="p-2">
                    <Skeleton className="h-5 w-40" />
                  </div>
                ) : (statusOptions || []).length > 0 ? (
                  (statusOptions || []).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhum status disponível
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="w-full max-w-2xl">
        <label className="mb-2 block text-sm font-medium text-foreground">
          <span className="inline-flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            Pesquisar dados comerciais
          </span>
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar por cliente, vendedor ou produto..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        {searchTerm && (
          <p className="text-xs text-muted-foreground mt-1">
            Pesquisando por: "{searchTerm}" (cliente, vendedor ou produto)
          </p>
        )}
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-3">
              Total de Vendas
            </p>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold text-foreground">
                {stats?.total ?? 0}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-3">
              Vendas Fechadas
            </p>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold text-green-600">
                {stats?.vendas_fechadas ?? 0}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-3">
              Vendas Pendentes
            </p>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold text-yellow-600">
                {stats?.vendas_pendentes ?? 0}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-3">
              Valor Total
            </p>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(stats?.valor_total ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-3">
              Comissão Total
            </p>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats?.comissao_total ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seletor de quantidade por página */}
      <div className="flex items-center gap-2 mb-2 mt-2">
        <span className="text-sm">Mostrar:</span>
        <Select value={String(pageSize)} onValueChange={v => { setPageSize(v === "Todos" ? "Todos" : Number(v)); setPage(1); }}>
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map(opt => (
              <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm">por página</span>
      </div>

      {/* Tabela */}
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableCaption className="px-4 py-3 text-left">
            {comercialLoading && comercialFetching ? (
              <span>Carregando dados comerciais...</span>
            ) : totalCount > 0 ? (
              <span>
                Mostrando {showingFrom}–{showingTo} de {totalCount}{" "}
                {statusFilter && searchTerm
                  ? `para status "${statusFilter}" e pesquisa "${searchTerm}"`
                  : statusFilter
                  ? `para status "${statusFilter}"`
                  : searchTerm
                  ? `para pesquisa "${searchTerm}"`
                  : "no total"}
              </span>
            ) : (
              <span>Nenhum registro encontrado</span>
            )}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("cliente")}>
                Cliente {orderBy === "cliente" && (orderDir === "asc" ? <ArrowUp className="inline w-3 h-3" /> : <ArrowDown className="inline w-3 h-3" />)}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("vendedor")}>
                Vendedor {orderBy === "vendedor" && (orderDir === "asc" ? <ArrowUp className="inline w-3 h-3" /> : <ArrowDown className="inline w-3 h-3" />)}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("produto")}>
                Produto {orderBy === "produto" && (orderDir === "asc" ? <ArrowUp className="inline w-3 h-3" /> : <ArrowDown className="inline w-3 h-3" />)}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("valor")}>
                Valor {orderBy === "valor" && (orderDir === "asc" ? <ArrowUp className="inline w-3 h-3" /> : <ArrowDown className="inline w-3 h-3" />)}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("status")}>
                Status {orderBy === "status" && (orderDir === "asc" ? <ArrowUp className="inline w-3 h-3" /> : <ArrowDown className="inline w-3 h-3" />)}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("data_venda")}>
                Data da Venda {orderBy === "data_venda" && (orderDir === "asc" ? <ArrowUp className="inline w-3 h-3" /> : <ArrowDown className="inline w-3 h-3" />)}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("comissao")}>
                Comissão {orderBy === "comissao" && (orderDir === "asc" ? <ArrowUp className="inline w-3 h-3" /> : <ArrowDown className="inline w-3 h-3" />)}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comercialLoading && comercialData?.rows?.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : (comercialData?.rows || []).length > 0 ? (
              (comercialData?.rows || []).map((item, idx) => (
                <TableRow key={`${item.id}-${idx}`}>
                  <TableCell className="font-medium text-foreground">
                    {item.cliente}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.vendedor}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.produto}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-foreground">
                    {formatCurrency(item.valor)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(item.status)}
                      className="text-xs"
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(item.data_venda).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-green-600">
                    {formatCurrency(item.comissao)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhum registro encontrado
                    </h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      {searchTerm
                        ? statusFilter
                          ? "Não há registros que correspondam à pesquisa e status selecionado."
                          : "Não há registros que correspondam à pesquisa."
                        : statusFilter
                        ? "Não há registros para o status selecionado."
                        : "Não há registros cadastrados no sistema."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && pageSize !== "Todos" && (
        <div className="flex justify-center pt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  className="cursor-pointer"
                />
              </PaginationItem>

              {pageNumbers.map((p, idx) =>
                p === "..." ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(p as number);
                      }}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                  className="cursor-pointer"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export const ComercialList = React.memo(ComercialListComponent);