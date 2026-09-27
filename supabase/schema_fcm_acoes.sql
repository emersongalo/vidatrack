-- Etapa 195 — marca quais aparelhos têm o app novo (1.0.5+), que sabe
-- mostrar a notificação de hábito com os botões "✓ Feito" e "Lembrar
-- em 30 min". Aparelhos com app antigo continuam recebendo a
-- notificação simples de sempre.
alter table public.fcm_tokens add column if not exists suporta_acoes boolean not null default false;
