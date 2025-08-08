
-- Função de métricas: total de usuários e total de e-mails únicos,
-- com filtro opcional por conta/empresa.
create or replace function public.usuarios_stats(conta_filter text default null)
returns table(total bigint, unique_emails bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*)::bigint as total,
    count(distinct email)::bigint as unique_emails
  from public.usuarios
  where (conta_filter is null or conta = conta_filter);
$$;

-- Função para listar contas/empresas distintas (sem nulos) ordenadas
create or replace function public.contas_list()
returns table(conta text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct conta::text
  from public.usuarios
  where conta is not null
  order by 1;
$$;
