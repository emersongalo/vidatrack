-- ========================================================
-- VidaTrack — Etapa 69: log de notificações (pra debugar envios
-- que falham silenciosamente)
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

create table if not exists public.log_notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  canal text not null check (canal in ('webpush', 'fcm')),
  sucesso boolean not null,
  erro text,
  criado_em timestamptz default now()
);

alter table public.log_notificacoes enable row level security;
-- Sem política de select pra usuário comum de propósito — é uma
-- tabela de diagnóstico interno, só o cliente administrativo lê.

create index if not exists idx_log_notificacoes_usuario_data on public.log_notificacoes(usuario_id, criado_em desc);
