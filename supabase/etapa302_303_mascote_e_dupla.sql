-- Etapas 302 e 303 — mascote do parceiro no jardim e descompartilhar hábito.
-- Só funções novas e uma regra ampliada; nenhum dado existente é alterado.

-- 302 (já aplicado): mascote de quem divide hábito comigo
create or replace function public.mascote_do_parceiro(p_user_id uuid)
returns jsonb
language sql stable security definer
set search_path to 'public', 'pg_temp'
as $$
  select jsonb_build_object(
    'mascote', p.mascote,
    'feitos', (select count(*) from public.habito_checkins c join public.habitos h on h.id = c.habito_id
               where c.usuario_id = p_user_id and h.eh_negativo = false)
  )
  from public.perfis p
  where p.id = p_user_id
    and p_user_id <> auth.uid()
    and exists (
      select 1 from public.compartilhamentos a
      join public.compartilhamentos b on b.item_id = a.item_id and b.tipo_item = 'habito'
      where a.tipo_item = 'habito'
        and auth.uid() in (a.dono_id, a.usuario_convidado_id)
        and p_user_id in (b.dono_id, b.usuario_convidado_id)
    );
$$;
revoke all on function public.mascote_do_parceiro(uuid) from public, anon;
grant execute on function public.mascote_do_parceiro(uuid) to authenticated;

-- 303 (já aplicado): novo tipo de recado
alter table public.habito_interacoes drop constraint if exists habito_interacoes_tipo_check;
alter table public.habito_interacoes add constraint habito_interacoes_tipo_check
  check (tipo = any (array['feito'::text, 'cutucar'::text, 'reacao'::text, 'dupla'::text, 'descompartilhou'::text])) not valid;

-- 303 (RODAR NO SQL EDITOR): descompartilhar hábito
create or replace function public.descompartilhar_habito(p_habito uuid, p_outro uuid default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  eu uuid := auth.uid();
  h public.habitos%rowtype;
  ex uuid;
  avisar uuid;
  novo uuid;
  meu_nome text;
begin
  if eu is null then raise exception 'sem login'; end if;
  select * into h from public.habitos where id = p_habito;
  if not found then raise exception 'habito nao encontrado'; end if;

  if h.dono_id = eu then
    if p_outro is null or not exists (
      select 1 from public.compartilhamentos
      where tipo_item = 'habito' and item_id = p_habito and usuario_convidado_id = p_outro
    ) then raise exception 'essa pessoa nao participa deste habito'; end if;
    ex := p_outro;
    avisar := p_outro;
  elsif exists (
    select 1 from public.compartilhamentos
    where tipo_item = 'habito' and item_id = p_habito and usuario_convidado_id = eu
  ) then
    ex := eu;
    avisar := h.dono_id;
  else
    raise exception 'sem acesso';
  end if;

  -- quem era convidado ganha uma cópia só dele, com o próprio histórico
  insert into public.habitos (dono_id, nome, cor, frequencia, dias_semana, icone, meta_diaria, unidade, ordem,
    eh_negativo, vezes_semana, horario_lembrete, horarios_lembrete, rotina, economia_dia, criado_em)
  values (ex, h.nome, h.cor, h.frequencia, h.dias_semana, h.icone, h.meta_diaria, h.unidade,
    (select count(*) from public.habitos where dono_id = ex), h.eh_negativo, h.vezes_semana,
    h.horario_lembrete, h.horarios_lembrete, h.rotina, h.economia_dia, h.criado_em)
  returning id into novo;

  update public.habito_checkins set habito_id = novo where habito_id = p_habito and usuario_id = ex;
  delete from public.compartilhamentos where tipo_item = 'habito' and item_id = p_habito and usuario_convidado_id = ex;
  delete from public.convites_compartilhamento where tipo_item = 'habito' and item_id = p_habito and usuario_convidado_id = ex;

  select coalesce(nullif(split_part(trim(coalesce(p.nome, '')), ' ', 1), ''), split_part(u.email, '@', 1))
    into meu_nome
    from auth.users u left join public.perfis p on p.id = u.id where u.id = eu;

  insert into public.habito_interacoes (habito_id, de_usuario, para_usuario, tipo, de_nome, habito_nome, data)
  values (case when avisar = ex then novo else p_habito end, eu, avisar, 'descompartilhou',
    left(meu_nome, 60), left(h.nome, 80), current_date);

  return jsonb_build_object('novo', novo, 'avisar', avisar, 'nome', h.nome, 'saiu', ex = eu, 'meu_nome', meu_nome);
end;
$$;
revoke all on function public.descompartilhar_habito(uuid, uuid) from public, anon;
grant execute on function public.descompartilhar_habito(uuid, uuid) to authenticated;
