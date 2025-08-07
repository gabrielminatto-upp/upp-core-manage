import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Phone, MapPin, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RamalForm } from "./RamalForm";

interface Ramal {
  id: string;
  nome: string;
  status: boolean;
  descricao_cliente: string;
  central: string;
  created_at: string;
}

export function RamaisList() {
  const [ramais, setRamais] = useState<Ramal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRamal, setEditingRamal] = useState<Ramal | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRamais();
  }, []);

  const fetchRamais = async () => {
    try {
      const { data, error } = await supabase
        .from('ramais')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRamais(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar ramais",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ramal?")) return;

    try {
      const { error } = await supabase
        .from('ramais')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Ramal excluído",
        description: "Ramal removido com sucesso.",
      });
      
      fetchRamais();
    } catch (error) {
      toast({
        title: "Erro ao excluir ramal",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (ramal: Ramal) => {
    setEditingRamal(ramal);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingRamal(null);
    fetchRamais();
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ramais')
        .update({ status: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Ramal ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });
      
      fetchRamais();
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  if (showForm) {
    return (
      <RamalForm
        ramal={editingRamal}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingRamal(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ramais Upphone</h1>
          <p className="text-muted-foreground">
            Gerencie ramais telefônicos e centrais do sistema
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Ramal
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-card animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ramais.map((ramal) => (
            <Card key={ramal.id} className="shadow-card hover:shadow-elevated transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {ramal.nome}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {ramal.descricao_cliente}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={ramal.status ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleStatus(ramal.id, ramal.status)}
                    >
                      <Circle 
                        className={`h-2 w-2 mr-1 ${ramal.status ? 'fill-green-500' : 'fill-red-500'}`} 
                      />
                      {ramal.status ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {ramal.central}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ramal)}
                      className="flex-1 gap-1"
                    >
                      <Pencil className="h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ramal.id)}
                      className="flex-1 gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && ramais.length === 0 && (
        <Card className="shadow-card text-center py-12">
          <CardContent>
            <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum ramal encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece adicionando o primeiro ramal ao sistema.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Ramal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}