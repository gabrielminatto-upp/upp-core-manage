
-- 1) Renomear a coluna para padronizar o nome conforme solicitado
ALTER TABLE public.usuarios
  RENAME COLUMN "idUppchannel" TO iduppchannel;

-- 2) Atualizar a função de estatísticas para contar IDs únicos de iduppchannel
CREATE OR REPLACE FUNCTION public.usuarios_stats(conta_filter text DEFAULT NULL::text)
RETURNS TABLE(total bigint, unique_uppchannel_ids bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  select
    count(*)::bigint as total,
    count(distinct iduppchannel)::bigint as unique_uppchannel_ids
  from public.usuarios
  where (conta_filter is null or conta = conta_filter);
$function$;
