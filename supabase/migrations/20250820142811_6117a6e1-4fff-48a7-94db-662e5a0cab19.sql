-- Primeiro, vamos criar uma tabela de perfis para usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles - usuários podem ver e editar apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Função para handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$;

-- Trigger para criar perfil automaticamente quando user se registra
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Agora vamos corrigir as políticas das tabelas existentes para serem mais restritivas

-- Remover políticas antigas muito permissivas
DROP POLICY IF EXISTS "Anyone can view usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Anyone can insert usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Anyone can view z-api" ON public."z-api";
DROP POLICY IF EXISTS "Anyone can insert usuarios" ON public."z-api";
DROP POLICY IF EXISTS "Anyone can view ramais" ON public.ramais;

-- Novas políticas mais restritivas - apenas usuários autenticados
CREATE POLICY "Authenticated users can view usuarios" ON public.usuarios
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert usuarios" ON public.usuarios
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view z-api" ON public."z-api"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert z-api" ON public."z-api"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view ramais" ON public.ramais
  FOR SELECT TO authenticated USING (true);

-- Trigger para updated_at na tabela profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();