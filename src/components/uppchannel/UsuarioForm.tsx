import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  conta: string;
}

interface UsuarioFormProps {
  usuario?: Usuario | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UsuarioForm({ usuario, onSuccess, onCancel }: UsuarioFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: usuario?.nome || "",
    email: usuario?.email || "",
    tipo: usuario?.tipo || "",
    conta: usuario?.conta || "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (usuario) {
        // Update existing usuario
        const { error } = await supabase
          .from('usuarios')
          .update(formData)
          .eq('id', usuario.id);

        if (error) throw error;

        toast({
          title: "Usuário atualizado",
          description: "Dados salvos com sucesso.",
        });
      } else {
        // Create new usuario
        const { error } = await supabase
          .from('usuarios')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Usuário criado",
          description: "Novo usuário adicionado com sucesso.",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar usuário",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {usuario ? "Editar Usuário" : "Novo Usuário"}
          </h1>
          <p className="text-muted-foreground">
            {usuario ? "Atualize os dados do usuário" : "Adicione um novo usuário ao sistema"}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl shadow-card">
        <CardHeader>
          <CardTitle>Dados do Usuário</CardTitle>
          <CardDescription>
            Preencha as informações necessárias para o usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Digite o nome completo"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Usuário</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(value) => handleInputChange("tipo", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="atendente">Atendente</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conta">Conta/Empresa</Label>
                <Input
                  id="conta"
                  type="text"
                  placeholder="Nome da empresa ou conta"
                  value={formData.conta}
                  onChange={(e) => handleInputChange("conta", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Salvando..." : (usuario ? "Atualizar" : "Criar")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}