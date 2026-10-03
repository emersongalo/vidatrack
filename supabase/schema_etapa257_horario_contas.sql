-- Etapa 257 — já aplicado no Supabase (fica aqui de registro)
alter table public.perfis add column if not exists horario_contas text not null default '08:00'
  check (horario_contas ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
