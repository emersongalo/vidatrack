-- ========================================================
-- VidaTrack — Etapa 6: Hoje (agenda), Tarefas, Categorias, Timer
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

-- Compartilhamento agora também vale para tarefas
alter table public.compartilhamentos drop constraint if exists compartilhamentos_tipo_item_check;
alter table public.compartilhamentos
  add constraint compartilhamentos_tipo_item_check
  check (tipo_item in ('habito', 'nota', 'financa', 'tarefa'));

-- ========================================================
-- Categorias — usadas tanto por Hábitos quanto por Tarefas,
-- funcionam como as "listas" do HabitNow
-- ========================================================

create table if not exists public.categorias_produtividade (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  cor text not null default 'habito', -- habito | nota | financa | neutro
  criado_em timestamptz default now()
);

alter table public.categorias_produtividade enable row level security;

create policy "dono gerencia suas categorias de produtividade"
  on public.categorias_produtividade for all
  using (auth.uid() = dono_id)
  with check (auth.uid() = dono_id);

-- ========================================================
-- Extensão da tabela de hábitos: ícone, categoria e lembrete
-- ========================================================

alter table public.habitos add column if not exists icone text not null default '💧';
alter table public.habitos add column if not exists categoria_id uuid references public.categorias_produtividade(id) on delete set null;
alter table public.habitos add column if not exists horario_lembrete time;

-- ========================================================
-- Tarefas — podem ser únicas (com data) ou repetir como hábito
-- ========================================================

create table if not exists public.tarefas (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references auth.users(id) on delete cascade,
  categoria_id uuid references public.categorias_produtividade(id) on delete set null,
  titulo text not null,
  icone text not null default '📝',
  subtarefas jsonb not null default '[]', -- [{ "id": "...", "texto": "...", "feita": false }]
  repetir text not null default 'nenhuma' check (repetir in ('nenhuma', 'diaria', 'dias_semana')),
  dias_semana int[] default '{}',
  data date, -- usado quando repetir = 'nenhuma'
  horario_lembrete time,
  concluida boolean not null default false, -- usado quando repetir = 'nenhuma'
  arquivada boolean not null default false,
  criado_em timestamptz default now()
);

alter table public.tarefas enable row level security;

create policy "dono ou convidado vê a tarefa"
  on public.tarefas for select
  using (auth.uid() = dono_id or public.tem_acesso_item('tarefa', id, true));

create policy "dono cria tarefa"
  on public.tarefas for insert
  with check (auth.uid() = dono_id);

create policy "dono ou convidado com edição atualiza a tarefa"
  on public.tarefas for update
  using (auth.uid() = dono_id or public.tem_acesso_item('tarefa', id, false));

create policy "só o dono remove a tarefa"
  on public.tarefas for delete
  using (auth.uid() = dono_id);

-- Conclusões de tarefas que repetem (mesma lógica dos check-ins de hábito)
create table if not exists public.tarefa_conclusoes (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  criado_em timestamptz default now(),
  unique (tarefa_id, usuario_id, data)
);

alter table public.tarefa_conclusoes enable row level security;

create policy "dono ou convidado vê conclusões da tarefa"
  on public.tarefa_conclusoes for select
  using (
    exists (
      select 1 from public.tarefas t
      where t.id = tarefa_id
        and (t.dono_id = auth.uid() or public.tem_acesso_item('tarefa', t.id, true))
    )
  );

create policy "usuário com acesso marca sua própria conclusão"
  on public.tarefa_conclusoes for insert
  with check (
    usuario_id = auth.uid()
    and exists (
      select 1 from public.tarefas t
      where t.id = tarefa_id
        and (t.dono_id = auth.uid() or public.tem_acesso_item('tarefa', t.id, false))
    )
  );

create policy "usuário remove sua própria conclusão"
  on public.tarefa_conclusoes for delete
  using (usuario_id = auth.uid());

create index if not exists idx_tarefa_conclusoes_tarefa_data on public.tarefa_conclusoes(tarefa_id, data);
create index if not exists idx_tarefas_dono_data on public.tarefas(dono_id, data);
