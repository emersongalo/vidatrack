-- ========================================================
-- VidaTrack — Etapa 42: notificação push nativa (FCM) pro app publicado
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

-- Diferente da `push_inscricoes` (usada pelo Web Push do navegador),
-- essa tabela guarda o "token" que o Firebase Cloud Messaging dá pro
-- app quando instalado de verdade no celular (via Play Store, ou
-- instalado direto do .apk) — é assim que a notificação nativa sabe
-- pra qual aparelho mandar.
create table if not exists public.fcm_tokens (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  criado_em timestamptz default now()
);

alter table public.fcm_tokens enable row level security;

create policy "usuário gerencia seus próprios tokens fcm"
  on public.fcm_tokens for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

create index if not exists idx_fcm_tokens_usuario on public.fcm_tokens(usuario_id);
