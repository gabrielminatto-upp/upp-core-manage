import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Usuario {
  nome: string;
  email: string;
  tipo: string;
  conta: string;
}

export function UsuariosList() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTipoBadgeVariant = (tipo: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "admin": "destructive",
      "usuario": "default",
      "supervisor": "secondary",
    };
    return variants[tipo.toLowerCase()] || "outline";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground mt-2">
            Consulta de usuários do sistema Uppchannel
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-card">
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : usuarios.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {usuarios.map((usuario, index) => (
            <Card key={`${usuario.nome}-${index}`} className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg">{usuario.nome}</CardTitle>
                  </div>
                  <Badge variant={getTipoBadgeVariant(usuario.tipo)}>
                    {usuario.tipo}
                  </Badge>
                </div>
                <CardDescription>{usuario.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Conta/Empresa</p>
                    <p className="text-sm text-muted-foreground">{usuario.conta}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Tipo</p>
                    <p className="text-sm text-muted-foreground">{usuario.tipo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum usuário encontrado
            </h3>
            <p className="text-muted-foreground text-center">
              Não há usuários cadastrados no sistema.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}