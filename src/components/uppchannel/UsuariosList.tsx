
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { useQuery } from "@tanstack/react-query";

interface Usuario {
  nome: string;
  email: string;
  tipo: string;
  conta: string | null;
  id?: string;
}

const PAGE_SIZE = 12;

export function UsuariosList() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [conta, setConta] = useState<string | null>(null);

  // Lista de contas/empresas
  const {
    data: contas,
    isLoading: contasLoading,
  } = useQuery({
    queryKey: ["contas_list"],
    queryFn: async () => {
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

  // Estatísticas (total e e-mails únicos) — respeita o filtro de conta
  const {
    data: stats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ["usuarios_stats", conta],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("usuarios_stats", {
        conta_filter: conta ?? null,
      });
      if (error) throw error;
      const row =
        (Array.isArray(data) && data.length > 0
          ? data[0]
          : { total: 0, unique_emails: 0 }) || { total: 0, unique_emails: 0 };
      return row as { total: number; unique_emails: number };
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

  // Usuários paginados — respeita o filtro de conta
  const {
    data: usuariosData,
    isLoading: usuariosLoading,
    isFetching: usuariosFetching,
  } = useQuery({
    queryKey: ["usuarios", conta, page, PAGE_SIZE],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase
        .from("usuarios")
        .select("*", { count: "exact" })
        .order("nome", { ascending: true });

      if (conta) {
        query = query.eq("conta", conta);
      }

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;

      return {
        rows: (data || []) as Usuario[],
        count: count || 0,
      };
    },
    keepPreviousData: true,
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
    () => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount]
  );

  // Reseta para a primeira página quando o filtro muda
  const handleContaChange = (value: string) => {
    setConta(value === "ALL" ? null : value);
    setPage(1);
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
    () => (totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1),
    [page, totalCount]
  );
  const showingTo = useMemo(
    () => Math.min(page * PAGE_SIZE, totalCount),
    [page, totalCount]
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground mt-2">
            Consulta de usuários do sistema Uppchannel
          </p>
        </div>

        {/* Filtro por Conta */}
        <div className="w-full md:w-[320px]">
          <label className="mb-2 block text-sm font-medium text-foreground">
            <span className="inline-flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Filtrar por conta/empresa
            </span>
          </label>
          <Select
            value={conta ?? "ALL"}
            onValueChange={handleContaChange}
          >
            <SelectTrigger className="w-full">
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
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total de usuários</p>
            {statsLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <p className="text-2xl font-bold text-foreground mt-2">
                {stats?.total ?? 0}
              </p>
            )}
            {conta && (
              <p className="text-xs text-muted-foreground mt-1">
                Filtrado por conta: {conta}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Usuários únicos (por e-mail)
            </p>
            {statsLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <p className="text-2xl font-bold text-foreground mt-2">
                {stats?.unique_emails ?? 0}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Considera apenas e-mails distintos
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Intervalo exibido
            </p>
            {usuariosLoading && !usuariosFetching ? (
              <Skeleton className="h-8 w-40 mt-2" />
            ) : (
              <p className="text-2xl font-bold text-foreground mt-2">
                {showingFrom} – {showingTo}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              De um total de {totalCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableCaption className="px-4 py-2 text-left">
            {usuariosLoading && usuariosFetching ? (
              <span>Carregando usuários...</span>
            ) : totalCount > 0 ? (
              <span>
                Mostrando {showingFrom}–{showingTo} de {totalCount}{" "}
                {conta ? `para "${conta}"` : "no total"}
              </span>
            ) : (
              <span>Nenhum usuário encontrado</span>
            )}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Conta/Empresa</TableHead>
              <TableHead>Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuariosLoading && usuariosData?.rows?.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : (usuariosData?.rows || []).length > 0 ? (
              (usuariosData?.rows || []).map((usuario, idx) => (
                <TableRow key={usuario.id ?? `${usuario.email}-${idx}`}>
                  <TableCell className="font-medium text-foreground">
                    {usuario.nome}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {usuario.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {usuario.conta ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTipoBadgeVariant(usuario.tipo)}>
                      {usuario.tipo}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="flex flex-col items-center justify-center py-8">
                    <User className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhum usuário encontrado
                    </h3>
                    <p className="text-muted-foreground text-center">
                      {conta
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
      <Pagination className="mt-2">
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
  );
}
