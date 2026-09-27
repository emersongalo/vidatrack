-- Etapa 193 — novas repetições e prioridade nas tarefas.
-- Tudo aditivo: tarefas antigas continuam exatamente como estavam.

alter table public.tarefas
  add column if not exists dia_mes smallint check (dia_mes between 1 and 31),
  add column if not exists mes smallint check (mes between 1 and 12),
  add column if not exists intervalo_dias smallint check (intervalo_dias between 1 and 365),
  add column if not exists prioridade smallint not null default 0 check (prioridade between 0 and 3);

alter table public.tarefas drop constraint if exists tarefas_repetir_check;
alter table public.tarefas add constraint tarefas_repetir_check
  check (repetir in ('nenhuma', 'diaria', 'dias_semana', 'mensal', 'anual', 'intervalo'));
