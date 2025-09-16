/*
  # Criar tabela comercial

  1. Nova Tabela
    - `comercial`
      - `id` (uuid, primary key)
      - `cliente` (text, nome do cliente)
      - `vendedor` (text, nome do vendedor)
      - `produto` (text, nome do produto/serviço)
      - `valor` (numeric, valor da venda)
      - `status` (text, status da venda)
      - `data_venda` (date, data da venda)
      - `comissao` (numeric, valor da comissão)
      - `meta_mensal` (numeric, meta mensal do vendedor)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `comercial`
    - Adicionar política para usuários autenticados lerem dados
    - Adicionar política para usuários autenticados inserirem dados

  3. Índices
    - Índices para melhor performance em consultas
*/

-- Criar tabela comercial
CREATE TABLE IF NOT EXISTS public.comercial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente TEXT NOT NULL,
  vendedor TEXT NOT NULL,
  produto TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
  comissao NUMERIC(10,2) NOT NULL DEFAULT 0,
  meta_mensal NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_comercial_cliente ON public.comercial(cliente);
CREATE INDEX IF NOT EXISTS idx_comercial_vendedor ON public.comercial(vendedor);
CREATE INDEX IF NOT EXISTS idx_comercial_status ON public.comercial(status);
CREATE INDEX IF NOT EXISTS idx_comercial_data_venda ON public.comercial(data_venda);
CREATE INDEX IF NOT EXISTS idx_comercial_produto ON public.comercial(produto);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.comercial ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura para usuários autenticados
CREATE POLICY "Usuários autenticados podem visualizar dados comerciais" ON public.comercial
  FOR SELECT TO authenticated USING (true);

-- Criar política para permitir inserção para usuários autenticados
CREATE POLICY "Usuários autenticados podem inserir dados comerciais" ON public.comercial
  FOR INSERT TO authenticated WITH CHECK (true);

-- Criar política para permitir atualização para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar dados comerciais" ON public.comercial
  FOR UPDATE TO authenticated USING (true);

-- Criar função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION public.update_comercial_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_comercial_updated_at
  BEFORE UPDATE ON public.comercial
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comercial_updated_at();

-- Inserir dados de exemplo
INSERT INTO public.comercial (cliente, vendedor, produto, valor, status, data_venda, comissao, meta_mensal) VALUES
  ('Empresa ABC Ltda', 'João Silva', 'Sistema CRM Premium', 15000.00, 'fechada', '2025-01-10', 1500.00, 50000.00),
  ('Tech Solutions Inc', 'Maria Santos', 'Consultoria em TI', 8500.00, 'fechada', '2025-01-12', 850.00, 40000.00),
  ('Comércio XYZ', 'Pedro Costa', 'Software de Gestão', 12000.00, 'negociacao', '2025-01-15', 1200.00, 45000.00),
  ('Indústria 123', 'Ana Oliveira', 'Sistema ERP', 25000.00, 'pendente', '2025-01-18', 2500.00, 60000.00),
  ('Startup Digital', 'Carlos Ferreira', 'Plataforma E-commerce', 18000.00, 'fechada', '2025-01-20', 1800.00, 55000.00),
  ('Grupo Empresarial', 'Lucia Rodrigues', 'Sistema Integrado', 30000.00, 'negociacao', '2025-01-22', 3000.00, 70000.00),
  ('Pequena Empresa', 'Roberto Lima', 'Software Básico', 5000.00, 'fechada', '2025-01-25', 500.00, 30000.00),
  ('Corporação Global', 'Fernanda Alves', 'Solução Empresarial', 45000.00, 'pendente', '2025-01-28', 4500.00, 80000.00),
  ('Negócios Online', 'Thiago Martins', 'Sistema de Vendas', 9500.00, 'fechada', '2025-01-30', 950.00, 35000.00),
  ('Empresa Familiar', 'Patricia Souza', 'Gestão Financeira', 7200.00, 'cancelada', '2025-02-01', 0.00, 25000.00);