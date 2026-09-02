-- ========================================================
-- VidaTrack — Etapa 31: corrige nome de login Google + foto de perfil
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

alter table public.perfis add column if not exists foto_url text;

create or replace function public.lidar_novo_usuario()
returns trigger as $$
begin
  insert into public.perfis (id, nome, foto_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'nome',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- Conserta retroativamente quem já se cadastrou com Google antes desta
-- correção e ficou sem nome/foto salvos — só preenche quem está com o
-- campo vazio, não sobrescreve nada que a pessoa já tenha editado.
update public.perfis p
set
  nome = coalesce(p.nome, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  foto_url = coalesce(p.foto_url, u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
from auth.users u
where u.id = p.id
  and (p.nome is null or p.foto_url is null);

-- ========================================================
-- Ícone de banco na conta (Nubank, Inter, Itaú, Bradesco, Santander,
-- C6, Caixa, Banco do Brasil, PicPay, Mercado Pago) — cor de marca,
-- sem reproduzir nenhum logotipo.
-- ========================================================

alter table public.financa_contas add column if not exists banco text default 'outro';

