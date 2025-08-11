import React from "react";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MessageSquare, Filter, Search, RefreshCw } from "lucide-react";
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

interface ZapiItem {
  id: string;
  nome: string;
  data_criacao: string;
  status_pagamento: string;
  meio: string;
  conectado: boolean;
}

const PAGE_SIZE = 12;

const ZapiListComponent = function ZapiList() {
  const { toast } = useToast();
  const { addExecution, updateExecutionStatus, pendingExecutions } =
    useWorkflowStatus();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<
    "idle" | "processando" | "concluido"
  >("idle");

  // Função para chamar o webhook
  const handleUpdate = async () => {
    setIsUpdating(true);
    setProcessingStatus("processando");

    try {
      // Gerar um ID único para rastrear esta execução
      const executionId = `update_zapi_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Adicionar à lista de execuções pendentes
      addExecution(executionId);

      const response = await fetch(
        "https://integrations-crm.absolutatecnologia.com.br/webhook/58f482fd-bbd9-4668-8c80-e56cce154df6",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "update_zapi",
            execution_id: executionId,
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        // Aguardar a resposta do webhook
        const result = await response.json();

        // Processar a resposta do n8n
        if (result.status === "completed") {
          setProcessingStatus("concluido");
          updateExecutionStatus(executionId, "completed", result.message);
          toast({
            title: "Atualização concluída!",
            description: result.message || "Dados Z-API atualizados com sucesso.",
          });
        } else if (result.status === "failed") {
          setProcessingStatus("idle");
          updateExecutionStatus(executionId, "failed", result.message);
          toast({
            title: "Erro na atualização",
            description: result.message || "Erro ao processar dados Z-API.",
            variant: "destructive",
          });
        } else {
          // Status ainda em processamento
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

  // Função para buscar todos os dados Z-API em lotes
  async function fetchAllZapiData() {
    const pageSize = 1000;
    let from = 0;
    let to = pageSize - 1;
    let allData: any[] = [];
    let finished = false;
    while (!finished) {
      let query = supabase.from("z-api").select("*", { count: "exact" });
      if (statusFilter) query = query.eq("status_pagamento", statusFilter);
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        query = query.or(
          `nome.ilike.%${searchLower}%,meio.ilike.%${searchLower}%`
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

  // Função para exportar todos os dados Z-API para Excel
  const handleExportExcel = async () => {
    try {
      const data = await fetchAllZapiData();
      if (!data || data.length === 0) {
        toast({
          title: "Nenhum dado encontrado para exportar.",
          variant: "destructive",
        });
        return;
      }
      // Monta os dados para exportação
      const exportData = data.map((item: any) => ({
        ID: item.id,
        Nome: item.nome,
        "Data de Criação": new Date(item.data_criacao).toLocaleDateString('pt-BR'),
        "Status de Pagamento": item.status_pagamento,
        Meio: item.meio,
        Conectado: item.conectado ? "Sim" : "Não",
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Z-API");
      XLSX.writeFile(wb, "zapi_data.xlsx");
    } catch (err: any) {
      toast({
        title: "Erro ao exportar para Excel",
        description: err?.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  // Lista de status de pagamento
  const { data: statusOptions, isLoading: statusLoading } = useQuery<string[]>({
    queryKey: ["zapi_status_list"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("z-api")
        .select("status_pagamento")
        .not("status_pagamento", "is", null);
      if (error) throw error;
      const statusList = [...new Set((data || []).map((r: any) => r.status_pagamento))];
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
    conectados: number;
    desconectados: number;
  }>({
    queryKey: ["zapi_stats", statusFilter, searchTerm],
    queryFn: async (): Promise<{
      total: number;
      conectados: number;
      desconectados: number;
    }> => {
      let query = supabase.from("z-api").select("*", { count: "exact" });

      if (statusFilter) {
        query = query.eq("status_pagamento", statusFilter);
      }

      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        query = query.or(
          `nome.ilike.%${searchLower}%,meio.ilike.%${searchLower}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      const total = data?.length || 0;
      const conectados = data?.filter((item: any) => item.conectado).length || 0;
      const desconectados = total - conectados;

      return {
        total,
        conectados,
        desconectados,
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

  // Dados Z-API paginados
  const {
    data: zapiData = { rows: [], count: 0 },
    isLoading: zapiLoading,
    isFetching: zapiFetching,
  } = useQuery<{ rows: ZapiItem[]; count: number }>({
    queryKey: ["zapi", statusFilter, searchTerm, page, PAGE_SIZE],
    queryFn: async (): Promise<{ rows: ZapiItem[]; count: number }> => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase
        .from("z-api")
        .select("*", { count: "exact" })
        .order("nome", { ascending: true });

      if (statusFilter) {
        query = query.eq("status_pagamento", statusFilter);
      }

      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        query = query.or(
          `nome.ilike.%${searchLower}%,meio.ilike.%${searchLower}%`
        );
      }

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;

      return {
        rows: (data || []) as ZapiItem[],
        count: count || 0,
      };
    },
    placeholderData: keepPreviousData,
    meta: {
      onError: (err: any) => {
        toast({
          title: "Erro ao carregar dados Z-API",
          description: err?.message || "Tente novamente mais tarde.",
          variant: "destructive",
        });
      },
    },
  });

  const totalCount = zapiData?.count ?? 0;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount]
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

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      ativo: "default",
      inativo: "destructive",
      pendente: "secondary",
      cancelado: "outline",
    };
    return variants[status?.toLowerCase?.()] || "outline";
  };

  const getConnectionBadgeVariant = (conectado: boolean) => {
    return conectado ? "default" : "destructive";
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
    () => (totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1),
    [page, totalCount]
  );
  const showingTo = useMemo(
    () => Math.min(page * PAGE_SIZE, totalCount),
    [page, totalCount]
  );

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Z-API</h1>
          <p className="text-muted-foreground mt-1">
            Consulta de dados do sistema Z-API
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
            Pesquisar dados Z-API
          </span>
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar por nome ou meio..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        {searchTerm && (
          <p className="text-xs text-muted-foreground mt-1">
            Pesquisando por: "{searchTerm}" (nome ou meio)
          </p>
        )}
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-3">
              Total de registros
            </p>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold text-foreground">
                {stats?.total ?? 0}
              </p>
            )}
            {(statusFilter || searchTerm) && (
              <p className="text-xs text-muted-foreground mt-3">
                {statusFilter && searchTerm
                  ? `Filtrado por status: ${statusFilter} e pesquisa: "${searchTerm}"`
                  : statusFilter
                  ? `Filtrado por status: ${statusFilter}`
                  : `Pesquisando por: "${searchTerm}"`}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-3">
              Conectados
            </p>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold text-green-600">
                {stats?.conectados ?? 0}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Registros conectados
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-3">
              Desconectados
            </p>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold text-red-600">
                {stats?.desconectados ?? 0}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Registros desconectados
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-3">
              Intervalo exibido
            </p>
            {zapiLoading && !zapiFetching ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-3xl font-bold text-foreground">
                {showingFrom} – {showingTo}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              De um total de {totalCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableCaption className="px-4 py-3 text-left">
            {zapiLoading && zapiFetching ? (
              <span>Carregando dados Z-API...</span>
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
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-32">Data de Criação</TableHead>
              <TableHead className="w-40">Status de Pagamento</TableHead>
              <TableHead className="w-32">Meio</TableHead>
              <TableHead className="w-24">Conectado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zapiLoading && zapiData?.rows?.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : (zapiData?.rows || []).length > 0 ? (
              (zapiData?.rows || []).map((item, idx) => (
                <TableRow key={`${item.id}-${idx}`}>
                  <TableCell className="font-mono text-sm text-foreground">
                    {item.id}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {item.nome}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(item.data_criacao).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(item.status_pagamento)}
                      className="text-xs"
                    >
                      {item.status_pagamento}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.meio}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getConnectionBadgeVariant(item.conectado)}
                      className="text-xs"
                    >
                      {item.conectado ? "Sim" : "Não"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
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
      {totalPages > 1 && (
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

export const ZapiList = React.memo(ZapiListComponent);
