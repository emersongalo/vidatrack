import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BotaoAtivarNotificacoes } from "@/components/BotaoAtivarNotificacoes";
import {
  gerarCodigoVinculoTelegram,
  atualizarHorarioResumo,
  desvincularTelegram,
} from "./actions_telegram";

export default async function NotificacoesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: vinculo }, { data: codigoPendente }] = await Promise.all([
    supabase
      .from("telegram_vinculos")
      .select("chat_id, horario_resumo_diario")
      .eq("usuario_id", user?.id ?? "")
      .maybeSingle(),
    supabase
      .from("telegram_codigos_vinculo")
      .select("codigo, expira_em")
      .eq("usuario_id", user?.id ?? "")
      .gte("expira_em", new Date().toISOString())
      .maybeSingle(),
  ]);

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <Link href="/dashboard" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Painel
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-2">Notificações</h1>
      <p className="text-ink-400 text-sm mb-6">
        Receba um aviso no horário que você definiu para cada hábito,
        tarefa ou nota com lembrete.
      </p>

      <BotaoAtivarNotificacoes />

      <div className="mt-8 pt-6 border-t border-base-600">
        <h2 className="font-display font-semibold mb-1">Telegram</h2>
        <p className="text-ink-400 text-sm mb-4">
          Receba os lembretes e um resumo diário dos seus hábitos direto
          no Telegram — funciona mesmo sem instalar nada além do
          Telegram no celular.
        </p>

        {vinculo ? (
          <div className="space-y-4">
            <p className="text-sm bg-habito-soft text-habito border border-habito/30 rounded-lg px-3 py-2">
              ✅ Conectado ao Telegram
            </p>

            <form action={atualizarHorarioResumo} className="flex items-center gap-2">
              <label htmlFor="horario" className="text-sm text-ink-400 shrink-0">
                Resumo diário às
              </label>
              <input
                id="horario"
                name="horario"
                type="time"
                defaultValue={vinculo.horario_resumo_diario?.slice(0, 5)}
                className="bg-base-800 border border-base-600 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-ink-100 outline-none transition"
              />
              <button
                type="submit"
                className="text-sm border border-base-600 rounded-lg px-3 py-2 hover:bg-base-800 transition shrink-0"
              >
                Salvar
              </button>
            </form>

            <form action={desvincularTelegram}>
              <button type="submit" className="text-sm text-ink-400 hover:text-red-400 transition">
                Desconectar do Telegram
              </button>
            </form>
          </div>
        ) : (
          <div>
            {codigoPendente ? (
              <div className="bg-base-800 border border-base-600 rounded-xl2 p-4 mb-3">
                <p className="text-xs text-ink-400 mb-1">Seu código</p>
                <p className="text-2xl font-mono font-semibold tracking-widest">
                  {codigoPendente.codigo}
                </p>
                <p className="text-xs text-ink-400 mt-2">
                  Válido por 15 minutos.
                </p>
              </div>
            ) : null}

            <form action={gerarCodigoVinculoTelegram}>
              <button
                type="submit"
                className="text-sm bg-ink-100 text-base-900 font-medium rounded-lg px-4 py-2.5 hover:opacity-90 transition"
              >
                {codigoPendente ? "Gerar novo código" : "Conectar ao Telegram"}
              </button>
            </form>

            <ol className="text-xs text-ink-400 mt-4 space-y-1 list-decimal list-inside">
              <li>Clique no botão acima para gerar um código</li>
              <li>
                Abra o Telegram e procure pelo bot configurado pelo dono
                deste app
              </li>
              <li>Envie o código como mensagem pro bot</li>
              <li>
                Em até alguns minutos, esta tela vai mostrar "Conectado"
                (é preciso recarregar a página)
              </li>
            </ol>
          </div>
        )}
      </div>

      <p className="text-xs text-ink-400 mt-6">
        Os lembretes são checados a cada poucos minutos por um serviço
        externo (não é algo que fica rodando o tempo todo no seu
        celular), então pode haver uma pequena diferença entre o horário
        marcado e o aviso chegar.
      </p>
    </main>
  );
}
