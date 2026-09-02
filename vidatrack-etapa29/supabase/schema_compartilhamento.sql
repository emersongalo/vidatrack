-- ========================================================
-- VidaTrack — Etapa 5: interface de compartilhamento
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de schema.sql, schema_habitos.sql, schema_notas.sql
-- e schema_financas.sql)
-- ========================================================

-- Evita convidar a mesma pessoa duas vezes para o mesmo item
alter table public.compartilhamentos
  drop constraint if exists compartilhamentos_unico;
alter table public.compartilhamentos
  add constraint compartilhamentos_unico unique (tipo_item, item_id, email_convidado);

-- Busca o ID de um usuário pelo e-mail. Roda com privilégio elevado
-- (security definer) porque a tabela auth.users não é acessível
-- diretamente pelo app — só devolve o ID, nada mais.
create or replace function public.buscar_usuario_por_email(p_email text)
returns uuid as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$ language sql security definer stable;

-- Quando alguém que já tinha convites pendentes (por e-mail, antes de
-- ter conta) se cadastra, vincula automaticamente esses convites à
-- conta recém-criada.
create or replace function public.vincular_convites_pendentes()
returns trigger as $$
begin
  update public.compartilhamentos
  set usuario_convidado_id = new.id
  where usuario_convidado_id is null
    and lower(email_convidado) = lower(new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists ao_vincular_convites on auth.users;
create trigger ao_vincular_convites
  after insert on auth.users
  for each row execute procedure public.vincular_convites_pendentes();

-- Permite que o dono de um item veja o nome de quem ele convidou,
-- mesmo que o convidado ainda não tenha aceitado/logado
create or replace function public.nome_do_usuario(p_user_id uuid)
returns text as $$
  select coalesce(p.nome, u.email) from auth.users u
  left join public.perfis p on p.id = u.id
  where u.id = p_user_id;
$$ language sql security definer stable;
