-- Etapa 273 — convites de compartilhamento (aceitar / recusar)
-- Rode no Supabase: SQL Editor → New query → cole tudo → Run.
-- Pode rodar mais de uma vez sem problema. Não altera nenhum dado.
-- (A tabela convites_compartilhamento e as políticas dela já foram criadas.)

-- 1) Quem foi convidado aceita ou recusa por esta função.
create or replace function public.responder_convite(p_convite uuid, p_aceitar boolean)
returns json
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  c public.convites_compartilhamento;
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then
    raise exception 'Entre na sua conta';
  end if;

  select * into c
  from public.convites_compartilhamento
  where id = p_convite
    and status = 'pendente'
    and (usuario_convidado_id = auth.uid() or lower(email_convidado) = v_email)
  for update;

  if not found then
    raise exception 'Convite nao encontrado ou ja respondido';
  end if;

  if p_aceitar then
    insert into public.compartilhamentos (tipo_item, item_id, dono_id, usuario_convidado_id, email_convidado, permissao)
    values (c.tipo_item, c.item_id, c.dono_id, auth.uid(), c.email_convidado, c.permissao)
    on conflict (tipo_item, item_id, email_convidado)
    do update set usuario_convidado_id = excluded.usuario_convidado_id, permissao = excluded.permissao;
    delete from public.convites_compartilhamento where id = c.id;
  else
    update public.convites_compartilhamento
      set status = 'recusado', respondido_em = now(), usuario_convidado_id = auth.uid()
      where id = c.id;
  end if;

  return json_build_object(
    'tipo_item', c.tipo_item,
    'item_id', c.item_id,
    'dono_id', c.dono_id,
    'nome_item', c.nome_item,
    'aceito', p_aceitar
  );
end;
$function$;

revoke all on function public.responder_convite(uuid, boolean) from public, anon;
grant execute on function public.responder_convite(uuid, boolean) to authenticated;

-- 2) Quem se cadastra depois de ser convidado já recebe os convites.
create or replace function public.vincular_convites_pendentes()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  update public.compartilhamentos
  set usuario_convidado_id = new.id
  where usuario_convidado_id is null
    and lower(email_convidado) = lower(new.email);

  update public.convites_compartilhamento
  set usuario_convidado_id = new.id
  where usuario_convidado_id is null
    and lower(email_convidado) = lower(new.email);
  return new;
end;
$function$;

-- 3) O acesso só nasce quando a pessoa aceita: o dono não cria mais
--    compartilhamento direto (só pelo convite). Os que já existem continuam.
drop policy if exists "dono gerencia seus compartilhamentos" on public.compartilhamentos;

-- 4) Limpeza de um teste que ficou no banco.
drop function if exists public.vt_teste_272();
