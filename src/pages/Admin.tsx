import React from 'react';
import { UserRegistrationForm } from '@/components/admin/UserRegistrationForm';
import { UserList } from '@/components/admin/UserList';

const Admin = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administração</h1>
        <p className="text-muted-foreground">
          Gerencie usuários e suas permissões no sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserRegistrationForm />
        <div className="lg:col-span-2">
          <UserList />
        </div>
      </div>
    </div>
  );
};

export default Admin;