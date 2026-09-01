-- ========================================================
-- VidaTrack — Etapa 4: módulo de Finanças
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de schema.sql, schema_habitos.sql e schema_notas.sql)
-- ========================================================

create table if not exists public.financa_contas (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  tipo text not null default 'banco' check (tipo in ('carteira', 'banco', 'cartao')),
  saldo_inicial numeric(12,2) not null default 0,
  arquivado boolean not null default false,
  criado_em timestamptz default now()
);

alter table public.financa_contas enable row level security;

create policy "dono ou convidado vê a conta"
  on public.financa_contas for select
  using (auth.uid() = dono_id or public.tem_acesso_item('financa', id, true));

create policy "dono cria conta"
  on public.financa_contas for insert
  with check (auth.uid() = dono_id);

create policy "dono ou convidado com edição atualiza a conta"
  on public.financa_contas for update
  using (auth.uid() = dono_id or public.tem_acesso_item('financa', id, false));

create policy "só o dono remove a conta"
  on public.financa_contas for delete
  using (auth.uid() = dono_id);

-- ========================================================
-- Categorias — pessoais, não compartilhadas (cada pessoa organiza
-- suas categorias do seu jeito, mesmo numa conta compartilhada)
-- ========================================================

create table if not exists public.financa_categorias (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  meta_mensal numeric(12,2),
  criado_em timestamptz default now()
);

alter table public.financa_categorias enable row level security;

create policy "dono gerencia suas categorias"
  on public.financa_categorias for all
  using (auth.uid() = dono_id)
  with check (auth.uid() = dono_id);

-- ========================================================
-- Lançamentos
-- ========================================================

create table if not exists public.financa_transacoes (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references auth.users(id) on delete cascade,
  conta_id uuid not null references public.financa_contas(id) on delete cascade,
  categoria_id uuid references public.financa_categorias(id) on delete set null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  valor numeric(12,2) not null check (valor > 0),
  descricao text,
  data date not null default current_date,
  criado_em timestamptz default now()
);

alter table public.financa_transacoes enable row level security;

create policy "dono ou convidado vê lançamentos da conta"
  on public.financa_transacoes for select
  using (
    exists (
      select 1 from public.financa_contas c
      where c.id = conta_id
        and (c.dono_id = auth.uid() or public.tem_acesso_item('financa', c.id, true))
    )
  );

create policy "dono ou convidado com edição lança"
  on public.financa_transacoes for insert
  with check (
    dono_id = auth.uid()
    and exists (
      select 1 from public.financa_contas c
      where c.id = conta_id
        and (c.dono_id = auth.uid() or public.tem_acesso_item('financa', c.id, false))
    )
  );

create policy "quem lançou ou o dono da conta remove"
  on public.financa_transacoes for delete
  using (
    dono_id = auth.uid()
    or exists (select 1 from public.financa_contas c where c.id = conta_id and c.dono_id = auth.uid())
  );

create index if not exists idx_financa_transacoes_conta_data on public.financa_transacoes(conta_id, data);

-- Categorias padrão para quem já tem conta — rode manualmente se quiser
-- (novos cadastros já recebem isso automaticamente, veja a função abaixo)
create or replace function public.criar_categorias_padrao(p_usuario_id uuid)
returns void as $$
begin
  insert into public.financa_categorias (dono_id, nome, tipo) values
    (p_usuario_id, 'Salário', 'receita'),
    (p_usuario_id, 'Outras receitas', 'receita'),
    (p_usuario_id, 'Alimentação', 'despesa'),
    (p_usuario_id, 'Moradia', 'despesa'),
    (p_usuario_id, 'Transporte', 'despesa'),
    (p_usuario_id, 'Lazer', 'despesa'),
    (p_usuario_id, 'Saúde', 'despesa'),
    (p_usuario_id, 'Outras despesas', 'despesa')
  on conflict do nothing;
end;
$$ language plpgsql security definer;

-- Estende o trigger de novo usuário (criado na Etapa 1) para já vir com
-- categorias padrão
create or replace function public.lidar_novo_usuario()
returns trigger as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, new.raw_user_meta_data->>'nome');

  perform public.criar_categorias_padrao(new.id);

  return new;
end;
$$ language plpgsql security definer;
