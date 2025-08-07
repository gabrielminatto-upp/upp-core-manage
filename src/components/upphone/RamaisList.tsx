import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Ramal {
  id: string;
  nome: string;
  status: boolean;
  descricao_cliente: string;
  central: string;
}

export function RamaisList() {
  const [ramais, setRamais] = useState<Ramal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRamais();
  }, []);

  const fetchRamais = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ramais')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setRamais(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar ramais",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ramais</h1>
          <p className="text-muted-foreground mt-2">
            Consulta de ramais do sistema Upphone
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
      ) : ramais.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ramais.map((ramal) => (
            <Card key={ramal.id} className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg">{ramal.nome}</CardTitle>
                  </div>
                  <Badge variant={ramal.status ? "default" : "secondary"}>
                    {ramal.status ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <CardDescription>{ramal.central}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Descrição/Cliente</p>
                    <p className="text-sm text-muted-foreground">
                      {ramal.descricao_cliente || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Central</p>
                    <p className="text-sm text-muted-foreground">
                      {ramal.central}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Status: {ramal.status ? "Ativo" : "Inativo"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Phone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum ramal encontrado
            </h3>
            <p className="text-muted-foreground text-center">
              Não há ramais cadastrados no sistema.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}