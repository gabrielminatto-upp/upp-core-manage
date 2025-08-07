-- Drop existing RLS policies for usuarios table
DROP POLICY IF EXISTS "Authenticated users can create usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Authenticated users can delete usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Authenticated users can update usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Authenticated users can view usuarios" ON public.usuarios;

-- Drop existing RLS policies for ramais table
DROP POLICY IF EXISTS "Authenticated users can create ramais" ON public.ramais;
DROP POLICY IF EXISTS "Authenticated users can delete ramais" ON public.ramais;
DROP POLICY IF EXISTS "Authenticated users can update ramais" ON public.ramais;
DROP POLICY IF EXISTS "Authenticated users can view ramais" ON public.ramais;

-- Create new read-only policies for anonymous users for usuarios table
CREATE POLICY "Anyone can view usuarios" 
ON public.usuarios 
FOR SELECT 
USING (true);

-- Create new read-only policies for anonymous users for ramais table
CREATE POLICY "Anyone can view ramais" 
ON public.ramais 
FOR SELECT 
USING (true);