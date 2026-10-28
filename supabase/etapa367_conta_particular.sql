-- Etapa 367 — conta financeira compartilhada ou particular.
-- Particular = conta sem ninguém em compartilhamentos (as regras de
-- acesso já funcionam por conta). Estas funções só ligam/desligam.
-- Não altera nenhum dado existente.

create or replace function public.parceiros_financas()
returns setof uuid
language sql stable security definer
set search_path to 'public', 'pg_temp'
as $$
  select distinct outro from (
    select c.usuario_convidado_id as outro
      from public.compartilhamentos c
      join public.financa_contas fc on fc.id = c.item_id
     where c.tipo_item = 'financa' and fc.dono_id = auth.uid()
    union
    select fc.dono_id
      from public.compartilhamentos c
      join public.financa_contas fc on fc.id = c.item_id
     where c.tipo_item = 'financa' and c.usuario_convidado_id = auth.uid()
  ) x
  where outro is not null and outro <> auth.uid();
$$;

create or replace function public.definir_conta_compartilhada(p_conta uuid, p_compartilhar boolean)
returns integer
language plpgsql security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  eu uuid := auth.uid();
  n integer := 0;
  p uuid;
  v_email text;
  v_perm text;
begin
  if eu is null then raise exception 'sem login'; end if;
  if not exists (select 1 from public.financa_contas where id = p_conta and dono_id = eu) then
    raise exception 'so o dono da conta pode mudar isso';
  end if;

  if not p_compartilhar then
    delete from public.compartilhamentos where tipo_item = 'financa' and item_id = p_conta;
    delete from public.convites_compartilhamento where tipo_item = 'financa' and item_id = p_conta and status = 'pendente';
    return 0;
  end if;

  for p in select * from public.parceiros_financas() loop
    select email into v_email from auth.users where id = p;
    -- mesma permissão que a pessoa já tem nas minhas outras contas;
    -- se só a outra pessoa compartilha comigo, os dois lançam (edição)
    select case when count(*) = 0 or bool_or(c.permissao = 'edicao') then 'edicao' else 'leitura' end
      into v_perm
      from public.compartilhamentos c join public.financa_contas fc on fc.id = c.item_id
     where c.tipo_item = 'financa' and fc.dono_id = eu and c.usuario_convidado_id = p;
    insert into public.compartilhamentos (tipo_item, item_id, dono_id, usuario_convidado_id, email_convidado, permissao)
    values ('financa', p_conta, eu, p, lower(coalesce(v_email, '')), v_perm)
    on conflict (tipo_item, item_id, email_convidado)
    do update set usuario_convidado_id = excluded.usuario_convidado_id;
    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke all on function public.parceiros_financas() from public, anon;
revoke all on function public.definir_conta_compartilhada(uuid, boolean) from public, anon;
grant execute on function public.parceiros_financas() to authenticated;
grant execute on function public.definir_conta_compartilhada(uuid, boolean) to authenticated;
