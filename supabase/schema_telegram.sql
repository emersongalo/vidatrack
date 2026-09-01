-- ========================================================
-- VidaTrack — Etapa 13: Integração com Telegram
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

-- Notas ganham lembrete, igual hábitos e tarefas já tinham
alter table public.notas add column if not exists horario_lembrete time;

-- Lembretes agora também valem para notas (antes só habito/tarefa)
alter table public.lembretes_enviados drop constraint if exists lembretes_enviados_tipo_item_check;
alter table public.lembretes_enviados
  add constraint lembretes_enviados_tipo_item_check
  check (tipo_item in ('habito', 'tarefa', 'nota'));

-- ========================================================
-- Vínculo de cada usuário com um chat do Telegram
-- ========================================================

create table if not exists public.telegram_vinculos (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  chat_id text not null unique,
  horario_resumo_diario time not null default '07:00',
  criado_em timestamptz default now()
);

alter table public.telegram_vinculos enable row level security;

-- O usuário só consegue VER, ATUALIZAR (horário do resumo) e REMOVER
-- (desvincular) o próprio registro. A criação (INSERT) só acontece
-- pelo servidor (cliente administrativo), quando o código de
-- vinculação é confirmado — por isso não existe policy de insert
-- para usuários comuns aqui.
create policy "usuário vê seu próprio vínculo"
  on public.telegram_vinculos for select
  using (auth.uid() = usuario_id);

create policy "usuário atualiza seu próprio vínculo"
  on public.telegram_vinculos for update
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

create policy "usuário remove seu próprio vínculo"
  on public.telegram_vinculos for delete
  using (auth.uid() = usuario_id);

-- ========================================================
-- Código temporário de vinculação (o usuário gera no app, envia
-- pro bot no Telegram, e o servidor confirma o vínculo)
-- ========================================================

create table if not exists public.telegram_codigos_vinculo (
  codigo text primary key,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  expira_em timestamptz not null,
  criado_em timestamptz default now()
);

alter table public.telegram_codigos_vinculo enable row level security;

create policy "usuário gerencia seus próprios códigos"
  on public.telegram_codigos_vinculo for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ========================================================
-- Controle interno de sincronização com a API do Telegram
-- (só o servidor acessa — sem policies, fica bloqueado pra todo
-- mundo exceto o cliente administrativo)
-- ========================================================

create table if not exists public.telegram_estado (
  id int primary key default 1,
  ultimo_update_id bigint not null default 0,
  constraint uma_linha_so check (id = 1)
);

insert into public.telegram_estado (id, ultimo_update_id)
values (1, 0)
on conflict (id) do nothing;

alter table public.telegram_estado enable row level security;
-- Nenhuma policy criada de propósito: ninguém além do service_role
-- (que ignora RLS) consegue ler ou escrever aqui.

-- ========================================================
-- Controle de envio do resumo diário (evita mandar 2x no mesmo dia)
-- ========================================================

create table if not exists public.resumos_enviados (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  criado_em timestamptz default now(),
  unique (usuario_id, data)
);

alter table public.resumos_enviados enable row level security;

create policy "usuário vê seus próprios resumos enviados"
  on public.resumos_enviados for select
  using (auth.uid() = usuario_id);
