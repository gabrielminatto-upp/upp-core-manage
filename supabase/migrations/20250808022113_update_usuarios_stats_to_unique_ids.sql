-- Atualizar função de métricas: total de usuários e total de IDs únicos,
-- com filtro opcional por conta/empresa.
create or replace function public.usuarios_stats(conta_filter text default null)
returns table(total bigint, unique_ids bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*)::bigint as total,
    count(distinct id)::bigint as unique_ids
  from public.usuarios
  where (conta_filter is null or conta = conta_filter);
$$; 