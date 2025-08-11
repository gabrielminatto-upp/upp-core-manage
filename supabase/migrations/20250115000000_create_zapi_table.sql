-- Criar tabela zapi
CREATE TABLE public.zapi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status_pagamento TEXT NOT NULL,
  meio TEXT NOT NULL,
  conectado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX idx_zapi_nome ON public.zapi(nome);
CREATE INDEX idx_zapi_status_pagamento ON public.zapi(status_pagamento);
CREATE INDEX idx_zapi_conectado ON public.zapi(conectado);
CREATE INDEX idx_zapi_data_criacao ON public.zapi(data_criacao);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.zapi ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura para usuários autenticados" ON public.zapi
  FOR SELECT USING (auth.role() = 'authenticated');

-- Criar função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION public.update_zapi_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_zapi_updated_at
  BEFORE UPDATE ON public.zapi
  FOR EACH ROW
  EXECUTE FUNCTION public.update_zapi_updated_at();

-- Inserir dados de exemplo
INSERT INTO public.zapi (nome, status_pagamento, meio, conectado) VALUES
  ('Cliente A', 'ativo', 'WhatsApp', true),
  ('Cliente B', 'pendente', 'Telegram', false),
  ('Cliente C', 'ativo', 'WhatsApp', true),
  ('Cliente D', 'inativo', 'Telegram', false),
  ('Cliente E', 'cancelado', 'WhatsApp', false),
  ('Cliente F', 'ativo', 'Telegram', true),
  ('Cliente G', 'pendente', 'WhatsApp', false),
  ('Cliente H', 'ativo', 'Telegram', true),
  ('Cliente I', 'inativo', 'WhatsApp', false),
  ('Cliente J', 'ativo', 'Telegram', true);
