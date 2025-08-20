import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/contexts/RoleContext';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  created_at: string;
}

export function UserList() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      // Get all profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          user_id,
          user_roles!inner(role)
        `);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Get user emails from auth.users (we can't query this directly via JS, 
      // so we'll need to get emails from profiles table or use a different approach)
      // For now, let's use the user_id from profiles to identify users
      const usersWithRoles: UserWithRole[] = profiles.map((profile: any) => ({
        id: profile.user_id,
        email: `user-${profile.user_id.slice(-8)}`, // Placeholder since we can't get email directly
        full_name: profile.full_name || 'Sem nome',
        role: profile.user_roles.role as AppRole,
        created_at: new Date().toISOString(), // Placeholder
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro ao carregar usuários',
        description: 'Não foi possível carregar a lista de usuários.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) {
        toast({
          title: 'Erro ao atualizar permissão',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Permissão atualizada',
        description: `Usuário agora é ${newRole === 'admin' ? 'administrador' : 'usuário normal'}.`,
      });

      // Refresh the list
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Não foi possível atualizar a permissão.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleBadgeVariant = (role: AppRole) => {
    return role === 'admin' ? 'destructive' : 'secondary';
  };

  const getRoleLabel = (role: AppRole) => {
    return role === 'admin' ? 'Administrador' : 'Usuário Normal';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Carregando usuários...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Usuários</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>ID do Usuário</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell className="font-mono text-sm">{user.id.slice(-12)}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value: AppRole) => updateUserRole(user.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário Normal</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}