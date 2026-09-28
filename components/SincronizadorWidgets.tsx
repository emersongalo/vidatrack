"use client";

import { useEffect, useRef } from "react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { montarDadosWidgets } from "@/lib/widgets/dados";
import { calcularPendencias } from "@/lib/notificacoes/calculo";
import { estaNoAppNativo, salvarDadosWidgets } from "@/lib/widgets/atualizar";

/**
 * Etapa 195 — mantém TODOS os widgets de tela inicial em dia enquanto
 * o app está aberto: toda vez que o retrato local muda (marcou um
 * hábito, lançou uma despesa...), recalcula e manda pro Android.
 * Com o app fechado, quem atualiza é o próprio Android, chamando
 * /api/widget/dados de 30 em 30 min. Fora do app nativo, não faz nada.
 */
export function SincronizadorWidgets() {
  const { snapshot } = useSnapshotOffline();
  const ultimoEnviado = useRef("");

  useEffect(() => {
    if (!snapshot || !estaNoAppNativo()) return;
    const { tarefasVencidas, lembretesPassados, alertasCategoria } = calcularPendencias(snapshot);
    const dados = montarDadosWidgets({
      hoje: hojeISO(),
      habitos: snapshot.habitos,
      // só os check-ins da própria pessoa (hábito compartilhado traz os do parceiro também)
      checkins: snapshot.habitoCheckins.filter((c: any) => !c.usuario_id || c.usuario_id === snapshot.perfil.id),
      tarefas: snapshot.tarefas,
      conclusoesTarefas: snapshot.conclusoesTarefas,
      contas: snapshot.financas.contas,
      recorrencias: snapshot.financas.recorrencias as any,
      transacoes: snapshot.financas.transacoes,
      pendencias: tarefasVencidas.length + lembretesPassados.length + alertasCategoria.length,
    });
    const assinatura = JSON.stringify({ ...dados, geradoEm: "" });
    if (assinatura === ultimoEnviado.current) return;
    ultimoEnviado.current = assinatura;
    salvarDadosWidgets(dados);
  }, [snapshot]);

  return null;
}
