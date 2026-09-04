import { LinkVoltar } from "@/components/LinkVoltar";
import { BotaoAtivarNotificacoes } from "@/components/BotaoAtivarNotificacoes";

export default function NotificacoesPage() {
  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <LinkVoltar href="/dashboard" texto="Painel" />
      <h1 className="text-2xl font-display font-semibold mt-4 mb-2">Notificações</h1>
      <p className="text-ink-400 text-sm mb-6">
        Receba um aviso, com som, no horário que você definiu pra cada
        hábito, tarefa ou nota — e também quando tiver uma conta a pagar
        vencendo hoje ou amanhã.
      </p>

      <BotaoAtivarNotificacoes />

      <div className="mt-6 space-y-3">
        <div className="flex items-start gap-3 bg-base-800 border border-base-600 rounded-xl2 p-4">
          <span className="text-lg shrink-0">🔔</span>
          <div>
            <p className="text-sm font-medium">No navegador (computador ou celular)</p>
            <p className="text-xs text-ink-400 mt-0.5">
              Ativa acima. Funciona com o VidaTrack aberto numa aba do
              Chrome, Edge ou similar.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-base-800 border border-base-600 rounded-xl2 p-4">
          <span className="text-lg shrink-0">📱</span>
          <div>
            <p className="text-sm font-medium">No app instalado</p>
            <p className="text-xs text-ink-400 mt-0.5">
              Se você instalou o VidaTrack como app (Play Store ou
              direto do .apk), ele pede a permissão de notificação
              sozinho na primeira vez que você abre — não precisa fazer
              nada aqui.
            </p>
          </div>
        </div>
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
