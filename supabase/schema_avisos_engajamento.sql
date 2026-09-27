-- Etapa 202 — avisos que trazem a pessoa de volta (já aplicado no Supabase)
alter table public.perfis add column if not exists aviso_noite boolean not null default true;
alter table public.perfis add column if not exists resumo_semanal boolean not null default true;
