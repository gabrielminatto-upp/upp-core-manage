-- Allow anonymous and authenticated clients to insert into public.usuarios
-- Keep RLS enabled and keep existing SELECT policy intact

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy only if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'usuarios' AND policyname = 'Anyone can insert usuarios'
  ) THEN
    CREATE POLICY "Anyone can insert usuarios"
    ON public.usuarios
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
  END IF;
END
$$;