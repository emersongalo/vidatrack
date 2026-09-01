-- ========================================================
-- VidaTrack — Etapa 12: Planejador de blocos de tempo
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

create table if not exists public.blocos_tempo (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  data date not null,
  hora_inicio time not null,
  hora_fim time not null,
  cor text not null default 'habito',
  criado_em timestamptz default now(),
  check (hora_fim > hora_inicio)
);

alter table public.blocos_tempo enable row level security;

-- Pessoal por enquanto (sem compartilhamento) — é uma agenda do seu
-- próprio dia; dá pra estender depois se fizer sentido.
create policy "dono gerencia seus blocos de tempo"
  on public.blocos_tempo for all
  using (auth.uid() = dono_id)
  with check (auth.uid() = dono_id);

create index if not exists idx_blocos_tempo_dono_data on public.blocos_tempo(dono_id, data);
