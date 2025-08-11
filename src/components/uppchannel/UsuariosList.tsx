import React from "react";
import { useState, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { User, Filter, Search, RefreshCw } from "lucide-react";
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

interface Usuario {
  nome: string;
  email: string;
  tipo: string;
  conta: string | null;
  iduppchannel?: string | null;
}

const PAGE_SIZE_OPTIONS = [1, 10, 100, "Todos"] as const;

const UsuariosListComponent = function UsuariosList() {
  const { toast } = useToast();
  const { addExecution, updateExecutionStatus, pendingExecutions } =
    useWorkflowStatus();
  const [page, setPage] = useState(1);
  const [conta, setConta] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<
    "idle" | "processando" | "concluido"
  >("idle");
  const [pageSize, setPageSize] = useState<number | "Todos">(12);

  // Função para chamar o webhook
  const handleUpdate = async () => {
    setIsUpdating(true);
    setProcessingStatus("processando");

    try {
      // Gerar um ID único para rastrear esta execução
      const executionId = `update_${Date.now()}_${Math.random()
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
            action: "update_usuarios",
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
            description: result.message || "Usuários atualizados com sucesso.",
          });
        } else if (result.status === "failed") {
          setProcessingStatus("idle");
          updateExecutionStatus(executionId, "failed", result.message);
          toast({
            title: "Erro na atualização",
            description: result.message || "Erro ao processar usuários.",
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

  // Função para buscar todos os usuários em lotes (acima de 1000)
  async function fetchAllUsuarios() {
    const pageSize = 1000;
    let from = 0;
    let to = pageSize - 1;
    let allUsers: any[] = [];
    let finished = false;
    while (!finished) {
      let query = supabase.from("usuarios").select("*", { count: "exact" });
      if (conta) query = query.eq("conta", conta);
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        query = query.or(
          `nome.ilike.%${searchLower}%,email.ilike.%${searchLower}%,conta.ilike.%${searchLower}%,idUppchannel.ilike.%${searchLower}%`
        );
      }
      const { data, error } = await query.range(from, to);
      if (error) throw error;
      allUsers = allUsers.concat(data || []);
      if (!data || data.length < pageSize) finished = true;
      from += pageSize;
      to += pageSize;
    }
    return allUsers;
  }

  // Função para exportar todos os usuários para Excel
  const handleExportExcel = async () => {
    try {
      const data = await fetchAllUsuarios();
      if (!data || data.length === 0) {
        toast({
          title: "Nenhum usuário encontrado para exportar.",
          variant: "destructive",
        });
        return;
      }
      // Monta os dados para exportação
      const exportData = data.map((u: any) => ({
        Nome: u.nome,
        Email: u.email,
        "ID Uppchannel": u.idUppchannel,
        "Conta/Empresa": u.conta,
        Tipo: u.tipo,
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Usuários");
      XLSX.writeFile(wb, "usuarios_uppchannel.xlsx");
    } catch (err: any) {
      toast({
        title: "Erro ao exportar para Excel",
        description: err?.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  // Remover o useEffect de limpeza de timerRef e doneTimerRef

  // Lista de contas/empresas (tipado)
  const { data: contas, isLoading: contasLoading } = useQuery<string[]>({
    queryKey: ["contas_list"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.rpc("contas_list");
      if (error) throw error;
      const contasList = (data || [])
        .map((r: { conta: string | null }) => r.conta)
        .filter((c: string | null): c is string => c !== null);
      return contasList;
    },
    meta: {
      onError: (err: any) => {
        toast({
          title: "Erro ao carregar contas",
          description: err?.message || "Tente novamente mais tarde.",
          variant: "destructive",
        });
      },
    },
  });

  // Estatísticas (total e IDs únicos) — respeita o filtro de conta e pesquisa (tipado)
  const { data: stats, isLoading: statsLoading } = useQuery<{
    total: number;
    unique_uppchannel_ids: number;
  }>({
    queryKey: ["usuarios_stats", conta, searchTerm],
    queryFn: async (): Promise<{
      total: number;
      unique_uppchannel_ids: number;
    }> => {
      // Se há termo de pesquisa, usar a contagem da query principal
      if (searchTerm.trim()) {
        // Fazer uma query para contar com os filtros aplicados
        let query = supabase
          .from("usuarios")
          .select("*", { count: "exact", head: true });

        if (conta) {
          query = query.eq("conta", conta);
        }

        const searchLower = searchTerm.toLowerCase().trim();
        query = query.or(
          `nome.ilike.%${searchLower}%,email.ilike.%${searchLower}%,conta.ilike.%${searchLower}%,iduppchannel.ilike.%${searchLower}%,idUppchannel.ilike.%${searchLower}%`
        );

        const { count, error } = await query;
        if (error) throw error;

        // Para IDs Uppchannel únicos com pesquisa, fazer uma query separada
        let uniqueQuery = supabase
          .from("usuarios")
          .select("iduppchannel,idUppchannel", { count: "exact" });

        if (conta) {
          uniqueQuery = uniqueQuery.eq("conta", conta);
        }

        uniqueQuery = uniqueQuery.or(
          `nome.ilike.%${searchLower}%,email.ilike.%${searchLower}%,conta.ilike.%${searchLower}%,iduppchannel.ilike.%${searchLower}%,idUppchannel.ilike.%${searchLower}%`
        );

        const { data: uniqueIds, error: uniqueError } = await uniqueQuery;
        if (uniqueError) throw uniqueError;

        // Contar IDs Uppchannel únicos
        const uniqueUppchannelIdSet = new Set(
          (uniqueIds || [])
            .map((u: any) => u.iduppchannel ?? (u as any).idUppchannel ?? null)
            .filter((id: string | null) => id !== null)
        );

        return {
          total: count || 0,
          unique_uppchannel_ids: uniqueUppchannelIdSet.size,
        };
      }

      // Se não há pesquisa, usar a RPC original
      const { data, error } = await supabase.rpc("usuarios_stats", {
        conta_filter: conta ?? null,
      });
      if (error) throw error;
      const row = (Array.isArray(data) && data.length > 0
        ? data[0]
        : { total: 0, unique_uppchannel_ids: 0 }) || {
        total: 0,
        unique_uppchannel_ids: 0,
      };
      return row as { total: number; unique_uppchannel_ids: number };
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

  // Usuários paginados — respeita o filtro de conta e pesquisa (tipado + keepPreviousData v5)
  const {
    data: usuariosData = { rows: [], count: 0 },
    isLoading: usuariosLoading,
    isFetching: usuariosFetching,
  } = useQuery<{ rows: Usuario[]; count: number }>({
    queryKey: ["usuarios", conta, searchTerm, page, pageSize],
    queryFn: async (): Promise<{ rows: Usuario[]; count: number }> => {
      let from = 0;
      let to = 0;
      if (pageSize === "Todos") {
        from = 0;
        to = 99999; // Limite alto para "Todos"
      } else {
        from = (page - 1) * (pageSize as number);
        to = from + (pageSize as number) - 1;
      }
      let query = supabase
        .from("usuarios")
        .select("*", { count: "exact" })
        .order("nome", { ascending: true });

      if (conta) {
        query = query.eq("conta", conta);
      }

      // Aplicar filtro de pesquisa se houver termo de busca
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        query = query.or(
          `nome.ilike.%${searchLower}%,email.ilike.%${searchLower}%,conta.ilike.%${searchLower}%,iduppchannel.ilike.%${searchLower}%,idUppchannel.ilike.%${searchLower}%`
        );
      }

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;

      return {
        rows: (data || []) as Usuario[],
        count: count || 0,
      };
    },
    // React Query v5: usar placeholderData: keepPreviousData
    placeholderData: keepPreviousData,
    meta: {
      onError: (err: any) => {
        toast({
          title: "Erro ao carregar usuários",
          description: err?.message || "Tente novamente mais tarde.",
          variant: "destructive",
        });
      },
    },
  });

  const totalCount = usuariosData?.count ?? 0;
  const totalPages = useMemo(
    () => pageSize === "Todos" ? 1 : Math.max(1, Math.ceil(totalCount / (pageSize as number))),
    [totalCount, pageSize]
  );

  // Reseta para a primeira página quando o filtro muda
  const handleContaChange = (value: string) => {
    setConta(value === "ALL" ? null : value);
    setPage(1);
  };

  // Função para lidar com mudanças na pesquisa
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset para primeira página quando pesquisar
  };

  const getTipoBadgeVariant = (tipo: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      admin: "destructive",
      usuario: "default",
      supervisor: "secondary",
      atendente: "default",
      operador: "secondary",
      agent: "default",
      AGENT: "default",
    };
    return variants[tipo?.toLowerCase?.()] || "outline";
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
    () => (totalCount === 0 ? 0 : (page - 1) * (pageSize as number) + 1),
    [page, totalCount, pageSize]
  );
  const showingTo = useMemo(
    () => Math.min(page * (pageSize as number), totalCount),
    [page, totalCount, pageSize]
  );

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Consulta de usuários do sistema Uppchannel
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

          {/* Filtro por Conta */}
          <div className="w-full md:w-[280px]">
            <label className="mb-1 block text-sm font-medium text-foreground">
              <span className="inline-flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                Filtrar por conta/empresa
              </span>
            </label>
            <Select value={conta ?? "ALL"} onValueChange={handleContaChange}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Todas as contas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as contas</SelectItem>
                {contasLoading ? (
                  <div className="p-2">
                    <Skeleton className="h-5 w-40" />
                  </div>
                ) : (contas || []).length > 0 ? (
                  (contas || []).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhuma conta disponível
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Barra de Pesquisa */}
          <div className="w-full max-w-2xl">
            <label className="mb-2 block text-sm font-medium text-foreground">
              <span className="inline-flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                Pesquisar usuários
              </span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar por nome, email, conta ou ID Uppchannel..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            {searchTerm && (
              <p className="text-xs text-muted-foreground mt-1">
                Pesquisando por: "{searchTerm}" (nome, email, conta ou ID
                Uppchannel)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-3">
              Total de usuários
            </p>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold text-foreground">
                {stats?.total ?? 0}
              </p>
            )}
            {(conta || searchTerm) && (
              <p className="text-xs text-muted-foreground mt-3">
                {conta && searchTerm
                  ? `Filtrado por conta: ${conta} e pesquisa: "${searchTerm}"`
                  : conta
                  ? `Filtrado por conta: ${conta}`
                  : `Pesquisando por: "${searchTerm}"`}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-3">
              IDs Uppchannel únicos
            </p>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold text-foreground">
                {stats?.unique_uppchannel_ids ?? 0}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              IDs únicos do Uppchannel
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-3">
              Intervalo exibido
            </p>
            {usuariosLoading && !usuariosFetching ? (
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
            {usuariosLoading && usuariosFetching ? (
              <span>Carregando usuários...</span>
            ) : totalCount > 0 ? (
              <span>
                Mostrando {showingFrom}–{showingTo} de {totalCount}{" "}
                {conta && searchTerm
                  ? `para "${conta}" e pesquisa "${searchTerm}"`
                  : conta
                  ? `para "${conta}"`
                  : searchTerm
                  ? `para pesquisa "${searchTerm}"`
                  : "no total"}
              </span>
            ) : (
              <span>Nenhum usuário encontrado</span>
            )}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-32">ID Uppchannel</TableHead>
              <TableHead className="w-40">Conta/Empresa</TableHead>
              <TableHead className="w-24">Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuariosLoading && usuariosData?.rows?.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : (usuariosData?.rows || []).length > 0 ? (
              (usuariosData?.rows || []).map((usuario, idx) => (
                <TableRow key={`${usuario.email}-${idx}`}>
                  <TableCell className="font-medium text-foreground">
                    {usuario.nome}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {usuario.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {usuario.iduppchannel ??
                      (usuario as any).idUppchannel ??
                      "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {usuario.conta ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getTipoBadgeVariant(usuario.tipo)}
                      className="text-xs"
                    >
                      {usuario.tipo}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-12">
                    <User className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhum usuário encontrado
                    </h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      {searchTerm
                        ? conta
                          ? "Não há usuários que correspondam à pesquisa e conta selecionada."
                          : "Não há usuários que correspondam à pesquisa."
                        : conta
                        ? "Não há usuários para a conta selecionada."
                        : "Não há usuários cadastrados no sistema."}
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

export const UsuariosList = React.memo(UsuariosListComponent);
