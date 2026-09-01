import { createClient as criarClienteSupabase } from "@supabase/supabase-js";

/**
 * Cliente administrativo do Supabase — usa a Service Role Key, que
 * ignora as políticas de RLS. NUNCA importe isto num componente
 * "use client" nem exponha essa chave no navegador.
 *
 * Uso: apenas em rotas que precisam ler/escrever dados de vários
 * usuários sem uma sessão de login. Hoje, só dois lugares no código
 * chamam isto:
 *   1. app/api/lembretes/route.ts — o cron de lembretes/resumo diário
 *   2. lib/compartilhamento/actions.ts — buscar se um e-mail convidado
 *      já tem conta (a função no banco só aceita ser chamada por essa
 *      chave, desde a Etapa 11)
 *
 * Todo uso é registrado em `acessos_administrativos` — não é uma
 * trava técnica contra alguém rodando SQL manual no painel, mas cria
 * um rastro auditável de que o código do app só usa esse acesso
 * elevado pra essas duas finalidades automáticas e documentadas,
 * nunca pra consultar dados de um usuário específico por curiosidade.
 *
 * IMPORTANTE: se você (ou alguém do time) for adicionar um novo uso
 * dessa função, passe um `motivo` claro — isso é o que faz esse log
 * significar alguma coisa.
 */
export function criarClienteAdmin(motivo: string, detalhe?: string) {
  const cliente = criarClienteSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // "Fire and forget" — não atrasa nem quebra a operação principal se
  // o log falhar por algum motivo.
  cliente
    .from("acessos_administrativos")
    .insert({ motivo, detalhe })
    .then(() => {})
    .catch(() => {});

  return cliente;
}
