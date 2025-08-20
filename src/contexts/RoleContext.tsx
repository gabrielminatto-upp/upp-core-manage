import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'user';

interface RoleContextType {
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  isUser: boolean;
  refreshRole: () => Promise<void>;
  hasRole: (requiredRole: AppRole) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Cache para evitar refetch desnecessário
  const [cachedUserId, setCachedUserId] = useState<string | null>(null);

  const fetchUserRole = useCallback(async () => {
    if (!user) {
      setRole(null);
      setLoading(false);
      setCachedUserId(null);
      return;
    }

    // Evitar refetch se o usuário não mudou
    if (cachedUserId === user.id && role !== null) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        setRole('user'); // Default to user role
      } else {
        setRole(data.role as AppRole);
      }
      setCachedUserId(user.id);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole('user'); // Default to user role
    } finally {
      setLoading(false);
    }
  }, [user, cachedUserId, role]);

  const refreshRole = useCallback(async () => {
    setLoading(true);
    setCachedUserId(null); // Force refresh
    await fetchUserRole();
  }, [fetchUserRole]);

  const hasRole = useCallback((requiredRole: AppRole): boolean => {
    if (!role) return false;
    if (requiredRole === 'user') return true; // All users have user role
    if (requiredRole === 'admin') return role === 'admin';
    return false;
  }, [role]);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  // Memoizar o value para evitar re-renders desnecessários
  const value: RoleContextType = useMemo(() => ({
    role,
    loading,
    isAdmin: role === 'admin',
    isUser: role === 'user',
    refreshRole,
    hasRole,
  }), [role, loading, refreshRole, hasRole]);

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}