-- ========================================================
-- VidaTrack — Etapa 3: módulo de Notas
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de schema.sql e schema_habitos.sql)
-- ========================================================

create table if not exists public.notas (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null default 'Sem título',
  conteudo text not null default '',
  arquivado boolean not null default false,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

alter table public.notas enable row level security;

create policy "dono ou convidado vê a nota"
  on public.notas for select
  using (auth.uid() = dono_id or public.tem_acesso_item('nota', id, true));

create policy "dono cria nota"
  on public.notas for insert
  with check (auth.uid() = dono_id);

create policy "dono ou convidado com edição atualiza a nota"
  on public.notas for update
  using (auth.uid() = dono_id or public.tem_acesso_item('nota', id, false));

create policy "só o dono remove a nota"
  on public.notas for delete
  using (auth.uid() = dono_id);

-- ========================================================
-- Anexos (arquivos e fotos, armazenados no Firebase Storage —
-- aqui guardamos só a referência: URL e metadados)
-- ========================================================

create table if not exists public.nota_anexos (
  id uuid primary key default gen_random_uuid(),
  nota_id uuid not null references public.notas(id) on delete cascade,
  enviado_por uuid not null references auth.users(id) on delete cascade,
  nome_arquivo text not null,
  caminho_storage text not null, -- caminho dentro do bucket "anexos" do Supabase Storage
  tipo text, -- ex: image/jpeg, application/pdf
  tamanho_bytes bigint,
  criado_em timestamptz default now()
);

alter table public.nota_anexos enable row level security;

create policy "quem vê a nota vê seus anexos"
  on public.nota_anexos for select
  using (
    exists (
      select 1 from public.notas n
      where n.id = nota_id
        and (n.dono_id = auth.uid() or public.tem_acesso_item('nota', n.id, true))
    )
  );

create policy "quem pode editar a nota anexa arquivos"
  on public.nota_anexos for insert
  with check (
    enviado_por = auth.uid()
    and exists (
      select 1 from public.notas n
      where n.id = nota_id
        and (n.dono_id = auth.uid() or public.tem_acesso_item('nota', n.id, false))
    )
  );

create policy "quem enviou ou o dono da nota remove o anexo"
  on public.nota_anexos for delete
  using (
    enviado_por = auth.uid()
    or exists (select 1 from public.notas n where n.id = nota_id and n.dono_id = auth.uid())
  );

create index if not exists idx_nota_anexos_nota on public.nota_anexos(nota_id);

-- Mantém `atualizado_em` sempre em dia
create or replace function public.marcar_atualizacao()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists ao_atualizar_nota on public.notas;
create trigger ao_atualizar_nota
  before update on public.notas
  for each row execute procedure public.marcar_atualizacao();
