-- ========================================================
-- VidaTrack — Etapa 2: módulo de Hábitos
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de já ter rodado o supabase/schema.sql da Etapa 1)
-- ========================================================

create table if not exists public.habitos (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  cor text not null default 'habito', -- referência à paleta do app
  frequencia text not null default 'diaria' check (frequencia in ('diaria', 'dias_semana')),
  dias_semana int[] default '{}', -- 0=domingo ... 6=sábado, usado se frequencia='dias_semana'
  arquivado boolean not null default false,
  criado_em timestamptz default now()
);

alter table public.habitos enable row level security;

-- Função auxiliar: verifica se o usuário tem acesso (dono ou convidado) a um item
create or replace function public.tem_acesso_item(p_tipo text, p_item_id uuid, p_somente_leitura_ok boolean default true)
returns boolean as $$
  select exists (
    select 1 from public.compartilhamentos c
    where c.tipo_item = p_tipo
      and c.item_id = p_item_id
      and c.usuario_convidado_id = auth.uid()
      and (p_somente_leitura_ok or c.permissao = 'edicao')
  );
$$ language sql security definer stable;

create policy "dono ou convidado vê o hábito"
  on public.habitos for select
  using (auth.uid() = dono_id or public.tem_acesso_item('habito', id, true));

create policy "dono cria hábito"
  on public.habitos for insert
  with check (auth.uid() = dono_id);

create policy "dono ou convidado com edição atualiza o hábito"
  on public.habitos for update
  using (auth.uid() = dono_id or public.tem_acesso_item('habito', id, false));

create policy "só o dono remove o hábito"
  on public.habitos for delete
  using (auth.uid() = dono_id);

-- ========================================================
-- Check-ins: cada marcação de "feito" num dia
-- ========================================================

create table if not exists public.habito_checkins (
  id uuid primary key default gen_random_uuid(),
  habito_id uuid not null references public.habitos(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  criado_em timestamptz default now(),
  unique (habito_id, usuario_id, data)
);

alter table public.habito_checkins enable row level security;

create policy "dono ou convidado vê check-ins do hábito"
  on public.habito_checkins for select
  using (
    exists (
      select 1 from public.habitos h
      where h.id = habito_id
        and (h.dono_id = auth.uid() or public.tem_acesso_item('habito', h.id, true))
    )
  );

create policy "usuário com acesso marca seu próprio check-in"
  on public.habito_checkins for insert
  with check (
    usuario_id = auth.uid()
    and exists (
      select 1 from public.habitos h
      where h.id = habito_id
        and (h.dono_id = auth.uid() or public.tem_acesso_item('habito', h.id, false))
    )
  );

create policy "usuário remove seu próprio check-in"
  on public.habito_checkins for delete
  using (usuario_id = auth.uid());

create index if not exists idx_habito_checkins_habito_data on public.habito_checkins(habito_id, data);
