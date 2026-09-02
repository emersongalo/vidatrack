-- ========================================================
-- VidaTrack — schema inicial (Etapa 1: apenas perfis + base)
-- Rode isso no SQL Editor do seu projeto Supabase.
-- ========================================================

-- Perfil de cada usuário (complementa auth.users)
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  criado_em timestamptz default now()
);

alter table public.perfis enable row level security;

create policy "usuário vê e edita o próprio perfil"
  on public.perfis for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Cria o perfil automaticamente quando alguém se cadastra
create or replace function public.lidar_novo_usuario()
returns trigger as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, new.raw_user_meta_data->>'nome');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute procedure public.lidar_novo_usuario();

-- ========================================================
-- Tabela de compartilhamento (reutilizada pelos 3 módulos
-- nas próximas etapas: habitos, notas, financas)
-- Cada linha de item vai ter um dono (dono_id).
-- compartilhamentos define quem mais tem acesso a qual item.
-- ========================================================

create table if not exists public.compartilhamentos (
  id uuid primary key default gen_random_uuid(),
  tipo_item text not null check (tipo_item in ('habito', 'nota', 'financa')),
  item_id uuid not null,
  dono_id uuid not null references auth.users(id) on delete cascade,
  usuario_convidado_id uuid references auth.users(id) on delete cascade,
  email_convidado text,
  permissao text not null default 'leitura' check (permissao in ('leitura', 'edicao')),
  criado_em timestamptz default now()
);

alter table public.compartilhamentos enable row level security;

create policy "dono e convidado veem o compartilhamento"
  on public.compartilhamentos for select
  using (auth.uid() = dono_id or auth.uid() = usuario_convidado_id);

create policy "dono gerencia seus compartilhamentos"
  on public.compartilhamentos for insert
  with check (auth.uid() = dono_id);

create policy "dono remove seus compartilhamentos"
  on public.compartilhamentos for delete
  using (auth.uid() = dono_id);
