import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Ramal {
  id: string;
  nome: string;
  status: boolean;
  descricao_cliente: string;
  central: string;
}

interface RamalFormProps {
  ramal?: Ramal | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RamalForm({ ramal, onSuccess, onCancel }: RamalFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: ramal?.nome || "",
    status: ramal?.status ?? true,
    descricao_cliente: ramal?.descricao_cliente || "",
    central: ramal?.central || "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (ramal) {
        const { error } = await supabase
          .from('ramais')
          .update(formData)
          .eq('id', ramal.id);
        if (error) throw error;
        toast({ title: "Ramal atualizado", description: "Dados salvos com sucesso." });
      } else {
        const { error } = await supabase
          .from('ramais')
          .insert([formData]);
        if (error) throw error;
        toast({ title: "Ramal criado", description: "Novo ramal adicionado com sucesso." });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar ramal",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {ramal ? "Editar Ramal" : "Novo Ramal"}
          </h1>
        </div>
      </div>

      <Card className="max-w-2xl shadow-card">
        <CardHeader>
          <CardTitle>Dados do Ramal</CardTitle>
          <CardDescription>Configure as informações do ramal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Ramal</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="central">Central</Label>
                <Input
                  id="central"
                  value={formData.central}
                  onChange={(e) => setFormData(prev => ({ ...prev, central: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição/Cliente</Label>
              <Input
                id="descricao"
                value={formData.descricao_cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao_cliente: e.target.value }))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={formData.status}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked }))}
              />
              <Label htmlFor="status">Ramal ativo</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Salvando..." : (ramal ? "Atualizar" : "Criar")}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}