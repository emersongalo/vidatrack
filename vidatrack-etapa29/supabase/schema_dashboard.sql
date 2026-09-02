-- ========================================================
-- VidaTrack — Etapa 14: tela inicial rica (clima, calendário, resumos)
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

alter table public.perfis add column if not exists latitude numeric(9,6);
alter table public.perfis add column if not exists longitude numeric(9,6);
alter table public.perfis add column if not exists local_nome text;
