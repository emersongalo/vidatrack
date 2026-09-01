-- ========================================================
-- VidaTrack — Etapa 20: ícones e cores nas categorias financeiras
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

alter table public.financa_categorias add column if not exists icone text not null default '💰';
alter table public.financa_categorias add column if not exists cor text not null default 'financa';

-- A tabela já tinha uma política "for all" pro dono (criada na Etapa 4),
-- que cobre insert/select/update/delete — então editar e excluir
-- categoria já funciona sem nenhuma política nova.
