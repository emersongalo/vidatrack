-- ========================================================
-- VidaTrack — Etapa 54: limpeza das tabelas do Telegram (opcional)
-- A integração com Telegram foi removida do app. Essas tabelas não
-- são mais usadas por nenhum código — rode isso SÓ SE quiser
-- realmente apagar esses dados. Não é obrigatório: se preferir manter
-- (por exemplo, pra guardar histórico), pode deixar como está, elas
-- só ficam sem uso, sem causar problema nenhum.
-- ========================================================

drop table if exists public.resumos_enviados;
drop table if exists public.telegram_codigos_vinculo;
drop table if exists public.telegram_vinculos;
drop table if exists public.telegram_estado;
