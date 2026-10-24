-- Etapa 341 — Agenda (compromissos pessoais e compartilhados)
-- Só ACRESCENTA tabelas/regras novas. Não mexe em nenhum dado existente.

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 120),
  descricao text check (descricao is null or char_length(descricao) <= 2000),
  local text check (local is null or char_length(local) <= 200),
  cor text not null default 'nota',
  tipo text not null default 'evento' check (tipo in ('evento', 'aniversario', 'data_especial')),
  data date not null,
  hora_inicio time,
  hora_fim time,
  repetir text not null default 'nenhuma' check (repetir in ('nenhuma', 'diaria', 'semanal', 'quinzenal', 'mensal', 'anual')),
  repetir_ate date,
  excecoes date[] not null default '{}',
  lembretes integer[] not null default '{}',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists eventos_dono_idx on public.eventos (dono_id);
create index if not exists eventos_data_idx on public.eventos (data);

create table if not exists public.evento_participantes (
  evento_id uuid not null references public.eventos(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  resposta text not null default 'pendente' check (resposta in ('pendente', 'vou', 'talvez', 'nao_vou')),
  respondido_em timestamptz,
  criado_em timestamptz not null default now(),
  primary key (evento_id, usuario_id)
);
create index if not exists evento_participantes_usuario_idx on public.evento_participantes (usuario_id);

-- funções "seguras" pra as regras não ficarem se chamando em círculo
create or replace function public.eh_dono_do_evento(p_evento uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.eventos e where e.id = p_evento and e.dono_id = auth.uid());
$$;
create or replace function public.participa_do_evento(p_evento uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.evento_participantes p where p.evento_id = p_evento and p.usuario_id = auth.uid());
$$;

alter table public.eventos enable row level security;
alter table public.evento_participantes enable row level security;

drop policy if exists "dono ou convidado vê o evento" on public.eventos;
create policy "dono ou convidado vê o evento" on public.eventos
  for select using (dono_id = auth.uid() or public.participa_do_evento(id));
drop policy if exists "dono cria o evento" on public.eventos;
create policy "dono cria o evento" on public.eventos
  for insert with check (dono_id = auth.uid());
drop policy if exists "dono altera o evento" on public.eventos;
create policy "dono altera o evento" on public.eventos
  for update using (dono_id = auth.uid()) with check (dono_id = auth.uid());
drop policy if exists "dono apaga o evento" on public.eventos;
create policy "dono apaga o evento" on public.eventos
  for delete using (dono_id = auth.uid());

drop policy if exists "dono e convidados veem a lista" on public.evento_participantes;
create policy "dono e convidados veem a lista" on public.evento_participantes
  for select using (usuario_id = auth.uid() or public.eh_dono_do_evento(evento_id) or public.participa_do_evento(evento_id));
drop policy if exists "dono convida" on public.evento_participantes;
create policy "dono convida" on public.evento_participantes
  for insert with check (public.eh_dono_do_evento(evento_id));
drop policy if exists "dono tira ou a pessoa sai" on public.evento_participantes;
create policy "dono tira ou a pessoa sai" on public.evento_participantes
  for delete using (public.eh_dono_do_evento(evento_id) or usuario_id = auth.uid());
drop policy if exists "convidado responde" on public.evento_participantes;
create policy "convidado responde" on public.evento_participantes
  for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- "já avisei" dos lembretes de evento (mesma tabela dos outros lembretes)
alter table public.lembretes_enviados drop constraint if exists lembretes_enviados_tipo_item_check;
alter table public.lembretes_enviados add constraint lembretes_enviados_tipo_item_check check (tipo_item = any (array[
  'habito', 'tarefa', 'nota', 'conta_a_pagar', 'orcamento_estourado', 'orcamento_80', 'resumo_noite', 'resumo_semana',
  'resumo_mes', 'fatura_cartao', 'resumo_manha', 'teto_80', 'teto_100', 'lembrete_lancar', 'evento'
]));
