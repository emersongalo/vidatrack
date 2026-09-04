-- ========================================================
-- VidaTrack — Etapa 54: lembrete de conta a pagar (hoje/amanhã)
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

-- Sem isso, o novo lembrete de "conta a pagar" nunca ficaria marcado
-- como enviado (a inserção seria rejeitada por essa restrição), e a
-- pessoa receberia a mesma notificação de novo a cada poucos minutos.
alter table public.lembretes_enviados drop constraint if exists lembretes_enviados_tipo_item_check;
alter table public.lembretes_enviados
  add constraint lembretes_enviados_tipo_item_check
  check (tipo_item in ('habito', 'tarefa', 'nota', 'conta_a_pagar'));
