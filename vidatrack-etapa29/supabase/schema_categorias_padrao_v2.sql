-- ========================================================
-- VidaTrack — Etapa 29: ícones nas categorias padrão + fim de recorrência
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

-- ========================================================
-- PARTE 1: ícones certos nas categorias padrão (não mais 💰 genérico
-- pra tudo)
-- ========================================================

create or replace function public.criar_categorias_padrao(p_usuario_id uuid)
returns void as $$
begin
  insert into public.financa_categorias (dono_id, nome, tipo, icone, cor) values
    (p_usuario_id, 'Salário', 'receita', '💼', 'habito'),
    (p_usuario_id, 'Outras receitas', 'receita', '✨', 'habito'),
    (p_usuario_id, 'Alimentação', 'despesa', '🍔', 'financa'),
    (p_usuario_id, 'Moradia', 'despesa', '🏠', 'financa'),
    (p_usuario_id, 'Transporte', 'despesa', '🚗', 'financa'),
    (p_usuario_id, 'Lazer', 'despesa', '🎬', 'financa'),
    (p_usuario_id, 'Saúde', 'despesa', '💊', 'financa'),
    (p_usuario_id, 'Outras despesas', 'despesa', '🛍️', 'financa')
  on conflict do nothing;
end;
$$ language plpgsql security definer;

-- Corrige retroativamente quem já tinha essas categorias criadas com o
-- ícone genérico (💰) antes desta etapa — só atualiza quem ainda está
-- com o valor padrão antigo, não mexe em ícone que você já trocou à mão.
update public.financa_categorias set icone = '💼' where nome = 'Salário' and icone = '💰';
update public.financa_categorias set icone = '✨' where nome = 'Outras receitas' and icone = '💰';
update public.financa_categorias set icone = '🍔' where nome = 'Alimentação' and icone = '💰';
update public.financa_categorias set icone = '🏠' where nome = 'Moradia' and icone = '💰';
update public.financa_categorias set icone = '🚗' where nome = 'Transporte' and icone = '💰';
update public.financa_categorias set icone = '🎬' where nome = 'Lazer' and icone = '💰';
update public.financa_categorias set icone = '💊' where nome = 'Saúde' and icone = '💰';
update public.financa_categorias set icone = '🛍️' where nome = 'Outras despesas' and icone = '💰';

-- ========================================================
-- PARTE 2: recorrência com data final (opcional) — "para sempre" ou
-- "até uma data", igual a maioria dos apps de finanças
-- ========================================================

alter table public.financa_recorrencias add column if not exists data_fim date;
