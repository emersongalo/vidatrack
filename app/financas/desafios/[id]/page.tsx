"use client";

import { useState, useTransition } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { completarQuadrado, excluirDesafio } from "../actions";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { Trash2 } from "lucide-react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

// Etapa 132 — a leitura (progresso, grid) já funciona offline, lendo
// do retrato. Marcar um quadrado continua exigindo internet de
// propósito: essa ação lança uma transação de verdade na sua conta
// ao mesmo tempo que atualiza o progresso, e prefiro fazer essa
// sincronização com cuidado numa etapa própria do que arriscar
// duplicar ou perder um valor de dinheiro de verdade.
export default function DesafioDetalhePage() {
  const params = useParams<{ id: string }>();
  const { snapshot, recarregar } = useSnapshotOffline();
  const [, iniciarTransicao] = useTransition();
  const [avisoOffline, setAvisoOffline] = useState(false);

  if (snapshot === undefined) return null;

  const desafio = (snapshot?.financas.desafios ?? []).find((d: any) => d.id === params.id);

  if (!desafio) {
    return (
      <main className="min-h-screen p-6 md:p-12 max-w-md lg:max-w-2xl mx-auto">
        <Link href="/financas/desafios" className="text-ink-400 text-sm hover:text-ink-100 transition">
          ← Desafios
        </Link>
        <p className="text-ink-400 text-sm mt-6">Não encontrei esse desafio no que está salvo no aparelho.</p>
      </main>
    );
  }

  const contaOrigem = (snapshot?.financas.contas ?? []).find((c: any) => c.id === desafio.conta_origem_id);
  const quadrados = (snapshot?.financas.desafioQuadrados ?? [])
    .filter((q: any) => q.desafio_id === desafio.id)
    .sort((a: any, b: any) => a.numero - b.numero);

  const percentual = Math.min(100, Math.round((Number(desafio.valor_guardado) / Number(desafio.valor_alvo)) * 100));
  const quantidadeFeitos = quadrados.filter((q: any) => q.completado).length;

  function marcarQuadrado(quadradoId: string) {
    if (!navigator.onLine) {
      setAvisoOffline(true);
      setTimeout(() => setAvisoOffline(false), 3000);
      return;
    }
    iniciarTransicao(async () => {
      await completarQuadrado(desafio.id, quadradoId);
      recarregar();
    });
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md lg:max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/financas/desafios" className="text-ink-400 text-sm hover:text-ink-100 transition">
          ← Desafios
        </Link>
        <BotaoComConfirmacao
          acao={excluirDesafio.bind(null, desafio.id)}
          textoBotao={<Trash2 size={14} strokeWidth={2} />}
          textoConfirmacao={`Excluir "${desafio.nome}"? O dinheiro já guardado não volta pra conta sozinho.`}
          classeBotao="text-ink-400 hover:text-red-400 transition"
        />
      </div>

      <h1 className="text-2xl font-display font-semibold mb-1">{desafio.nome}</h1>
      <p className="text-ink-400 text-sm mb-6">
        Saindo de {contaOrigem?.nome ?? "conta removida"} · {quantidadeFeitos} de {quadrados.length} quadrados
      </p>

      <div className="bg-base-800 border border-base-600 rounded-xl2 p-4 mb-6">
        <p className="text-xs text-ink-400 mb-1">{desafio.concluido ? "Concluído! 🎉" : "Guardado até agora"}</p>
        <p className="text-3xl font-mono font-bold mb-2">{formatarMoeda(desafio.valor_guardado)}</p>
        <div className="h-2 bg-base-600 rounded-full overflow-hidden mb-2">
          <div className={`h-full rounded-full ${desafio.concluido ? "bg-habito" : "bg-financa"}`} style={{ width: `${percentual}%` }} />
        </div>
        <p className="text-xs text-ink-400">Meta: {formatarMoeda(desafio.valor_alvo)}</p>
      </div>

      <p className="text-sm text-ink-400 mb-3">Clica num quadrado pra marcar (isso já tira o valor da conta)</p>
      {avisoOffline && (
        <p className="mb-3 text-xs bg-red-400/10 text-red-400 border border-red-400/30 rounded-lg px-3 py-2">
          Sem internet agora — marcar um quadrado precisa estar online, porque isso lança uma transação de
          verdade na sua conta.
        </p>
      )}
      <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
        {quadrados.map((q: any) => (
          <button
            key={q.id}
            type="button"
            disabled={q.completado}
            onClick={() => marcarQuadrado(q.id)}
            title={formatarMoeda(q.valor)}
            className={`w-full aspect-square rounded-lg text-xs font-mono flex flex-col items-center justify-center gap-0.5 border transition ${
              q.completado
                ? "bg-habito text-base-900 border-habito"
                : "border-base-600 text-ink-400 hover:border-financa hover:text-financa"
            }`}
          >
            <span className="font-semibold">{q.numero}</span>
            <span className="text-[9px]">{formatarMoeda(q.valor).replace("R$", "").trim()}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
