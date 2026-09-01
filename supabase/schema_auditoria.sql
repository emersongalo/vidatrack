-- ========================================================
-- VidaTrack — Etapa 19: log de auditoria de acesso administrativo
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

-- Toda vez que o código do servidor usa a chave administrativa
-- (que ignora RLS — usada hoje só pelo cron de lembretes e pela busca
-- de e-mail no convite de compartilhamento), fica um registro aqui.
-- Isso não impede um acesso indevido feito manualmente fora do código
-- do app, mas cria um rastro auditável do uso legítimo e automatizado,
-- que é o único uso que o código realmente faz.
create table if not exists public.acessos_administrativos (
  id uuid primary key default gen_random_uuid(),
  motivo text not null,
  detalhe text,
  criado_em timestamptz default now()
);

alter table public.acessos_administrativos enable row level security;
-- Nenhuma policy criada de propósito — só o service_role (que ignora
-- RLS) consegue escrever ou ler aqui. Nem os próprios usuários, nem
-- o dono do projeto pelo painel comum conseguem alterar esse log
-- usando a chave anônima.

create index if not exists idx_acessos_administrativos_data on public.acessos_administrativos(criado_em);
