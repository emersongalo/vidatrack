"use client";

import Link from "next/link";
import { LinkVoltar } from "@/components/LinkVoltar";
import { BotaoAtivarNotificacoes } from "@/components/BotaoAtivarNotificacoes";
import { Globe, Smartphone, AlertTriangle, BellRing } from "lucide-react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { calcularPendencias } from "@/lib/notificacoes/calculo";

// Etapa 139 — a "central" que faltava: até agora, uma notificação
// push que você não viu (ou nem tinha o celular na mão) sumia pra
// sempre, sem deixar rastro dentro do app. Isso calcula, na hora, a
// partir dos mesmos dados de sempre (sem tabela nova no banco):
// tarefas vencidas + hábitos/tarefas de hoje com horário de lembrete
// já passado e ainda não marcados.
export default function NotificacoesPage() {
  const { snapshot } = useSnapshotOffline();
  const { tarefasVencidas, lembretesPassados } = calcularPendencias(snapshot);
  const temAlgumPendente = tarefasVencidas.length > 0 || lembretesPassados.length > 0;

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <LinkVoltar href="/dashboard" texto="Painel" />
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Notificações</h1>

      {temAlgumPendente && (
        <div className="space-y-2 mb-8">
          {tarefasVencidas.map((t: any) => (
            <Link
              key={t.id}
              href="/habitos/tarefas"
              className="flex items-start gap-3 bg-red-400/10 border border-red-400/30 rounded-xl2 p-4 hover:bg-red-400/15 transition"
            >
              <span className="text-red-400 shrink-0 mt-0.5">
                <AlertTriangle size={18} strokeWidth={2} />
              </span>
              <div>
                <p className="text-sm font-medium">{t.titulo}</p>
                <p className="text-xs text-ink-400 mt-0.5">
                  Venceu em {new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")} e ainda não foi concluída
                </p>
              </div>
            </Link>
          ))}
          {lembretesPassados.map((l) => (
            <Link
              key={l.chave}
              href={l.href}
              className="flex items-start gap-3 bg-financa-soft border border-financa/30 rounded-xl2 p-4 hover:bg-financa/15 transition"
            >
              <span className="text-financa shrink-0 mt-0.5">
                <BellRing size={18} strokeWidth={2} />
              </span>
              <div>
                <p className="text-sm font-medium">{l.titulo}</p>
                <p className="text-xs text-ink-400 mt-0.5">Lembrete era pra {l.horario} — ainda não marcado hoje</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="text-ink-400 text-sm mb-6">
        Receba um aviso, com som, no horário que você definiu pra cada
        hábito ou tarefa — e também quando tiver uma conta a pagar
        vencendo hoje ou amanhã.
      </p>

      <BotaoAtivarNotificacoes />

      <div className="mt-6 space-y-3">
        <div className="flex items-start gap-3 bg-base-800 border border-base-600 rounded-xl2 p-4">
          <span className="text-lg shrink-0"><Globe size={20} strokeWidth={2} /></span>
          <div>
            <p className="text-sm font-medium">No navegador (computador ou celular)</p>
            <p className="text-xs text-ink-400 mt-0.5">
              Ativa acima. Funciona com o VidaTrack aberto numa aba do
              Chrome, Edge ou similar.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-base-800 border border-base-600 rounded-xl2 p-4">
          <span className="text-lg shrink-0"><Smartphone size={20} strokeWidth={2} /></span>
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
