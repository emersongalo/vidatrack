-- ========================================================
-- VidaTrack — Etapa 36: ordem personalizável dos blocos em Finanças
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

alter table public.perfis add column if not exists ordem_blocos_financas text[];
-- NULL = usa a ordem padrão (calendário, gráfico, links rápidos,
-- últimos lançamentos). Só é preenchido quando a pessoa personaliza.
