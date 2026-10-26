// Etapa 364 — mês que vem (e os seguintes) ainda não têm as contas fixas
// lançadas: o app só gera o lançamento quando o mês chega. Pra quem
// avança pra Novembro, elas aparecem como "previstas" (só na tela, nada
// é gravado no banco), entram no total do mês e no saldo previsto.
import { diasDasRecorrencias, mesCompetencia } from "@/lib/financas/competencia";

export type Prevista = {
  id: string;
  prevista: true;
  recorrencia_id: string;
  conta_id: string;
  categoria_id: string | null;
  tipo: string;
  valor: number;
  descricao: string | null;
  data: string;
  pago_em: null;
  transferencia_grupo: null;
};

function proximoMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, "0")}`;
}

/** contas fixas do mês `mes` (AAAA-MM) que ainda não foram lançadas */
export function recorrentesPrevistasDoMes(recorrencias: any[], transacoes: any[], mes: string): Prevista[] {
  const dias = diasDasRecorrencias(recorrencias);
  const ja = new Set(
    (transacoes ?? []).filter((t: any) => t.recorrencia_id && mesCompetencia(t, dias.get(t.recorrencia_id)) === mes).map((t: any) => t.recorrencia_id)
  );
  const lista: Prevista[] = [];
  for (const r of recorrencias ?? []) {
    if (r.ativo === false || ja.has(r.id)) continue;
    const data = `${mes}-${String(Math.min(28, Number(r.dia_mes) || 1)).padStart(2, "0")}`;
    if (r.data_fim && data > r.data_fim) continue;
    if (r.data_inicio && data < r.data_inicio) continue;
    lista.push({
      id: `prevista-${r.id}-${mes}`,
      prevista: true,
      recorrencia_id: r.id,
      conta_id: r.conta_id,
      categoria_id: r.categoria_id ?? null,
      tipo: r.tipo,
      valor: Number(r.valor),
      descricao: r.descricao ?? null,
      data,
      pago_em: null,
      transferencia_grupo: null,
    });
  }
  return lista.sort((a, b) => a.data.localeCompare(b.data));
}

/** todas as previstas do mês seguinte ao atual até `ateMes` (inclusive) */
export function recorrentesPrevistasAte(recorrencias: any[], transacoes: any[], mesAtual: string, ateMes: string): Prevista[] {
  const lista: Prevista[] = [];
  let mes = proximoMes(mesAtual);
  for (let i = 0; mes <= ateMes && i < 60; i++, mes = proximoMes(mes)) {
    lista.push(...recorrentesPrevistasDoMes(recorrencias, transacoes, mes));
  }
  return lista;
}
