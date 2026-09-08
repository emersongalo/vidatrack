-- ========================================================
-- VidaTrack — Etapa 92: campo de observações nas tarefas
-- Já apliquei isso direto no seu banco durante a conversa —
-- esse arquivo é só pra manter o histórico completo dos schemas.
-- ========================================================

alter table public.tarefas add column if not exists observacoes text;
