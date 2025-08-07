-- Create usuarios table for Uppchannel
CREATE TABLE public.usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('admin', 'atendente', 'supervisor', 'operador')),
  conta TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ramais table for Upphone  
CREATE TABLE public.ramais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  status BOOLEAN NOT NULL DEFAULT true,
  descricao_cliente TEXT,
  central TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ramais ENABLE ROW LEVEL SECURITY;

-- Create policies for usuarios (authenticated users can manage all)
CREATE POLICY "Authenticated users can view usuarios" 
ON public.usuarios 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create usuarios" 
ON public.usuarios 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update usuarios" 
ON public.usuarios 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete usuarios" 
ON public.usuarios 
FOR DELETE 
TO authenticated
USING (true);

-- Create policies for ramais (authenticated users can manage all)
CREATE POLICY "Authenticated users can view ramais" 
ON public.ramais 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create ramais" 
ON public.ramais 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update ramais" 
ON public.ramais 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete ramais" 
ON public.ramais 
FOR DELETE 
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ramais_updated_at
  BEFORE UPDATE ON public.ramais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data
INSERT INTO public.usuarios (nome, email, tipo, conta) VALUES
  ('João Silva', 'joao@upptech.com', 'admin', 'Upp Tecnologia'),
  ('Maria Santos', 'maria@cliente1.com', 'atendente', 'Cliente A'),
  ('Pedro Costa', 'pedro@cliente2.com', 'supervisor', 'Cliente B');

INSERT INTO public.ramais (nome, status, descricao_cliente, central) VALUES
  ('Ramal 1001', true, 'Recepção - Cliente A', 'Central SP'),
  ('Ramal 1002', true, 'Vendas - Cliente A', 'Central SP'),
  ('Ramal 2001', false, 'Suporte - Cliente B', 'Central RJ'),
  ('Ramal 2002', true, 'Financeiro - Cliente B', 'Central RJ');