-- Adicionar campo iduppchannel à tabela usuarios
ALTER TABLE public.usuarios 
ADD COLUMN iduppchannel TEXT;

-- Criar índice para melhor performance em consultas por iduppchannel
CREATE INDEX IF NOT EXISTS idx_usuarios_iduppchannel ON public.usuarios(iduppchannel);

-- Atualizar a função de estatísticas para incluir contagem de iduppchannel únicos
CREATE OR REPLACE FUNCTION public.usuarios_stats(conta_filter text default null)
RETURNS TABLE(total bigint, unique_uppchannel_ids bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    count(*)::bigint as total,
    count(distinct iduppchannel)::bigint as unique_uppchannel_ids
  FROM public.usuarios
  WHERE (conta_filter is null or conta = conta_filter);
$$;

-- Atualizar dados existentes com iduppchannel de exemplo
UPDATE public.usuarios 
SET iduppchannel = CASE 
  WHEN email = 'joao@upptech.com' THEN 'UPP001'
  WHEN email = 'maria@cliente1.com' THEN 'UPP002'
  WHEN email = 'pedro@cliente2.com' THEN 'UPP003'
  ELSE 'UPP' || LPAD(CAST(ROW_NUMBER() OVER (ORDER BY nome) AS TEXT), 3, '0')
END
WHERE iduppchannel IS NULL; 