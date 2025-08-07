import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Mail, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UsuarioForm } from "./UsuarioForm";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  conta: string;
  created_at: string;
}

export function UsuariosList() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar usuários",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Usuário excluído",
        description: "Usuário removido com sucesso.",
      });
      
      fetchUsuarios();
    } catch (error) {
      toast({
        title: "Erro ao excluir usuário",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingUsuario(null);
    fetchUsuarios();
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'admin':
        return 'default';
      case 'supervisor':
        return 'secondary';
      case 'atendente':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (showForm) {
    return (
      <UsuarioForm
        usuario={editingUsuario}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingUsuario(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuários Uppchannel</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, permissões e contas do sistema
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Usuário
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
          {usuarios.map((usuario) => (
            <Card key={usuario.id} className="shadow-card hover:shadow-elevated transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{usuario.nome}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      {usuario.email}
                    </CardDescription>
                  </div>
                  <Badge variant={getTipoBadgeVariant(usuario.tipo)}>
                    {usuario.tipo}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-3 w-3" />
                    {usuario.conta}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(usuario)}
                      className="flex-1 gap-1"
                    >
                      <Pencil className="h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(usuario.id)}
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

      {!isLoading && usuarios.length === 0 && (
        <Card className="shadow-card text-center py-12">
          <CardContent>
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum usuário encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece adicionando o primeiro usuário ao sistema.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Usuário
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}