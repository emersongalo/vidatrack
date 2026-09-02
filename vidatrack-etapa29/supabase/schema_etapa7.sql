-- ========================================================
-- VidaTrack — Etapa 7: metas numéricas, notas fixadas/buscáveis
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

-- Hábitos com meta numérica (ex: beber 8 copos de água por dia)
alter table public.habitos add column if not exists meta_diaria int not null default 1;
alter table public.habitos add column if not exists unidade text; -- ex: "copos", "min", "páginas"

-- Check-ins agora guardam uma quantidade, não só sim/não
-- (hábitos simples continuam funcionando: quantidade sempre 1)
alter table public.habito_checkins add column if not exists quantidade int not null default 1;

-- Notas: fixar no topo + busca por texto
alter table public.notas add column if not exists fixada boolean not null default false;

create index if not exists idx_notas_busca on public.notas
  using gin (to_tsvector('portuguese', titulo || ' ' || conteudo));
