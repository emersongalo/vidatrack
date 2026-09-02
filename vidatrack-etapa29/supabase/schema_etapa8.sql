-- ========================================================
-- VidaTrack — Etapa 8: recorrências, reordenação, estatísticas
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

-- Ordem manual (arrastar pra reordenar) em hábitos e tarefas
alter table public.habitos add column if not exists ordem int not null default 0;
alter table public.tarefas add column if not exists ordem int not null default 0;

-- Preenche a ordem inicial pela data de criação, pra quem já tinha itens
with numerados as (
  select id, row_number() over (partition by dono_id order by criado_em) as rn
  from public.habitos
)
update public.habitos h set ordem = n.rn from numerados n where n.id = h.id and h.ordem = 0;

with numerados as (
  select id, row_number() over (partition by dono_id order by criado_em) as rn
  from public.tarefas
)
update public.tarefas t set ordem = n.rn from numerados n where n.id = t.id and t.ordem = 0;

-- ========================================================
-- Lançamentos financeiros recorrentes (ex: aluguel todo dia 5)
-- ========================================================

create table if not exists public.financa_recorrencias (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references auth.users(id) on delete cascade,
  conta_id uuid not null references public.financa_contas(id) on delete cascade,
  categoria_id uuid references public.financa_categorias(id) on delete set null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  valor numeric(12,2) not null check (valor > 0),
  descricao text,
  dia_mes int not null check (dia_mes between 1 and 28), -- 28 evita problema em fevereiro
  ativo boolean not null default true,
  criado_em timestamptz default now()
);

alter table public.financa_recorrencias enable row level security;

create policy "dono ou convidado vê a recorrência"
  on public.financa_recorrencias for select
  using (
    exists (
      select 1 from public.financa_contas c
      where c.id = conta_id
        and (c.dono_id = auth.uid() or public.tem_acesso_item('financa', c.id, true))
    )
  );

create policy "dono ou convidado com edição cria recorrência"
  on public.financa_recorrencias for insert
  with check (
    dono_id = auth.uid()
    and exists (
      select 1 from public.financa_contas c
      where c.id = conta_id
        and (c.dono_id = auth.uid() or public.tem_acesso_item('financa', c.id, false))
    )
  );

create policy "dono ou convidado com edição atualiza recorrência"
  on public.financa_recorrencias for update
  using (
    exists (
      select 1 from public.financa_contas c
      where c.id = conta_id
        and (c.dono_id = auth.uid() or public.tem_acesso_item('financa', c.id, false))
    )
  );

create policy "quem criou ou o dono da conta remove a recorrência"
  on public.financa_recorrencias for delete
  using (
    dono_id = auth.uid()
    or exists (select 1 from public.financa_contas c where c.id = conta_id and c.dono_id = auth.uid())
  );

-- Liga cada lançamento gerado à recorrência que o originou, pra não
-- duplicar no mesmo mês
alter table public.financa_transacoes add column if not exists recorrencia_id uuid references public.financa_recorrencias(id) on delete set null;

create unique index if not exists idx_transacao_unica_por_recorrencia_mes
  on public.financa_transacoes (recorrencia_id, date_trunc('month', data))
  where recorrencia_id is not null;
