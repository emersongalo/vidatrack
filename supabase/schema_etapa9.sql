-- ========================================================
-- VidaTrack — Etapa 9: notificações push + analytics anônimo
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

create table if not exists public.push_inscricoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  chaves jsonb not null, -- { p256dh, auth }
  criado_em timestamptz default now()
);

alter table public.push_inscricoes enable row level security;

create policy "usuário gerencia suas próprias inscrições"
  on public.push_inscricoes for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- Evita reenviar o mesmo lembrete várias vezes no mesmo dia
create table if not exists public.lembretes_enviados (
  id uuid primary key default gen_random_uuid(),
  tipo_item text not null check (tipo_item in ('habito', 'tarefa')),
  item_id uuid not null,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  criado_em timestamptz default now(),
  unique (tipo_item, item_id, usuario_id, data)
);

alter table public.lembretes_enviados enable row level security;

create policy "usuário vê seus próprios lembretes enviados"
  on public.lembretes_enviados for select
  using (auth.uid() = usuario_id);

-- ========================================================
-- Analytics anônimo — sem usuário, sem IP, só contagem de uso
-- ========================================================

create table if not exists public.analytics_eventos (
  id uuid primary key default gen_random_uuid(),
  pagina text not null,
  criado_em timestamptz default now()
);

alter table public.analytics_eventos enable row level security;

-- Qualquer um pode inserir (é só um contador anônimo de visitas),
-- mas ninguém consegue ler pelo app — só você, direto no painel do
-- Supabase (Table Editor ou SQL Editor).
create policy "qualquer um registra um evento anônimo"
  on public.analytics_eventos for insert
  with check (true);
