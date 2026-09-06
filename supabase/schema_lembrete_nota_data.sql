-- ========================================================
-- VidaTrack — Etapa 58: lembrete de nota com data específica (opcional)
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

-- Se NULL: lembrete continua disparando todo dia no horário (como já
-- era). Se preenchida: dispara só nessa data específica, uma vez.
alter table public.notas add column if not exists data_lembrete date;
