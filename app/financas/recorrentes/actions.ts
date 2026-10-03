"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { esquemaRecorrencia, primeiroErro } from "@/lib/validacao/financas";
import { dataAtualNoFuso } from "@/lib/tempo/fuso";

export async function criarRecorrencia(formData: FormData): Promise<{ erro?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Saia e entre de novo." };

  const resultado = esquemaRecorrencia.safeParse({
    tipo: formData.get("tipo"),
    valor: formData.get("valor"),
    contaId: formData.get("contaId"),
    categoriaId: formData.get("categoriaId"),
    descricao: formData.get("descricao"),
    diaMes: formData.get("diaMes"),
    dataFim: formData.get("dataFim"),
  });
  if (!resultado.success) return { erro: primeiroErro(resultado) };

  const { error } = await supabase.from("financa_recorrencias").insert({
    dono_id: user.id,
    conta_id: resultado.data.contaId,
    categoria_id: resultado.data.categoriaId,
    tipo: resultado.data.tipo,
    valor: resultado.data.valor,
    descricao: resultado.data.descricao,
    dia_mes: resultado.data.diaMes,
    data_fim: resultado.data.dataFim,
  });
  if (error) return { erro: error.message };

  revalidatePath("/financas");
  revalidatePath("/financas/recorrentes");
  return {};
}

export async function alternarAtivaRecorrencia(recorrenciaId: string) {
  "use server";
  const supabase = createClient();

  const { data: r } = await supabase
    .from("financa_recorrencias")
    .select("ativo")
    .eq("id", recorrenciaId)
    .maybeSingle();

  await supabase
    .from("financa_recorrencias")
    .update({ ativo: !(r?.ativo ?? true) })
    .eq("id", recorrenciaId);

  revalidatePath("/financas/recorrentes");
}

export async function removerRecorrencia(recorrenciaId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("financa_recorrencias").delete().eq("id", recorrenciaId);
  revalidatePath("/financas/recorrentes");
}

/**
 * Gera os lançamentos do mês atual pra cada recorrência ativa que ainda
 * não tem um lançamento nesse mês. Roda toda vez que a tela de Finanças
 * é aberta — não é um agendador de verdade, mas cobre o caso comum de
 * "abro o app pelo menos uma vez por mês".
 *
 * Etapa 254 — gera já no começo do mês (antes do dia do vencimento),
 * como "a pagar": assim a conta aparece no extrato, dá pra ajustar o
 * valor só deste mês e marcar "Paguei". Data futura não sai do saldo
 * até chegar o dia (ou até marcar como pago).
 */
export async function garantirLancamentosRecorrentes() {
  const supabase = createClient();
  const user = await getUsuarioAtual();
  if (!user) return;

  const hojeISO = dataAtualNoFuso();
  const [anoAtual, mesAtual] = hojeISO.split("-").map(Number);

  const { data: recorrencias } = await supabase
    .from("financa_recorrencias")
    .select("id, conta_id, categoria_id, tipo, valor, descricao, dia_mes, data_fim, data_inicio")
    .eq("ativo", true)
    .eq("dono_id", user.id);

  if (!recorrencias || recorrencias.length === 0) return;

  const mm = String(mesAtual).padStart(2, "0");
  const primeiroDiaMes = `${anoAtual}-${mm}-01`;
  const ultimoDiaMes = `${anoAtual}-${mm}-${String(new Date(Date.UTC(anoAtual, mesAtual, 0)).getUTCDate()).padStart(2, "0")}`;

  const { data: jaGerados } = await supabase
    .from("financa_transacoes")
    .select("recorrencia_id")
    .not("recorrencia_id", "is", null)
    .gte("data", primeiroDiaMes)
    .lte("data", ultimoDiaMes);

  const idsJaGerados = new Set((jaGerados ?? []).map((t) => t.recorrencia_id));

  const paraInserir = [];
  for (const r of recorrencias) {
    if (idsJaGerados.has(r.id)) continue;

    const data = `${anoAtual}-${mm}-${String(Math.min(28, r.dia_mes)).padStart(2, "0")}`;

    // Se tem data final e esse mês já passou dela, não gera mais —
    // a recorrência "expirou" sozinha, sem precisar excluir na mão.
    if (r.data_fim && data > r.data_fim) continue;
    // Etapa 205 — ainda não começou (ex: fatura cadastrada pro mês que vem)
    if (r.data_inicio && data < r.data_inicio) continue;

    paraInserir.push({
      dono_id: user.id,
      conta_id: r.conta_id,
      categoria_id: r.categoria_id,
      tipo: r.tipo,
      valor: r.valor,
      descricao: r.descricao,
      data,
      recorrencia_id: r.id,
    });
  }

  // Um INSERT só com todas as linhas, em vez de um por recorrência —
  // evita N idas e voltas ao banco quando tem várias recorrências
  // pra gerar no mesmo dia.
  if (paraInserir.length > 0) {
    await supabase.from("financa_transacoes").insert(paraInserir);
  }
}

/**
 * Etapa 215 — "Cadastrar como recorrente" a partir de uma cobrança que
 * o app detectou se repetindo todo mês. Começa no próximo vencimento
 * (não duplica o mês que já foi cobrado).
 */
export async function criarRecorrenciaSugerida(dados: {
  contaId: string;
  categoriaId: string | null;
  valor: number;
  descricao: string;
  diaMes: number;
  dataInicio: string;
}): Promise<{ erro?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Saia e entre de novo." };
  const valor = Math.round(Number(dados.valor) * 100) / 100;
  const diaMes = Math.trunc(Number(dados.diaMes));
  if (!(valor > 0) || !(diaMes >= 1 && diaMes <= 28) || !/^\d{4}-\d{2}-\d{2}$/.test(dados.dataInicio)) {
    return { erro: "Dados inválidos" };
  }
  const { error } = await supabase.from("financa_recorrencias").insert({
    dono_id: user.id,
    conta_id: dados.contaId,
    categoria_id: dados.categoriaId,
    tipo: "despesa",
    valor,
    descricao: String(dados.descricao).slice(0, 200),
    dia_mes: diaMes,
    data_inicio: dados.dataInicio,
  });
  if (error) return { erro: error.message };
  revalidatePath("/financas");
  revalidatePath("/financas/recorrentes");
  return {};
}

/**
 * Etapa 254 — editar uma recorrência. Vale daqui pra frente: muda a
 * recorrência e os lançamentos dela que ainda estão "a pagar" (data
 * futura e não marcados como pagos). O que já foi pago nos meses
 * anteriores (ou já venceu) não muda.
 */
export async function atualizarRecorrencia(recorrenciaId: string, formData: FormData): Promise<{ erro?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Saia e entre de novo." };

  const resultado = esquemaRecorrencia.safeParse({
    tipo: formData.get("tipo"),
    valor: formData.get("valor"),
    contaId: formData.get("contaId"),
    categoriaId: formData.get("categoriaId"),
    descricao: formData.get("descricao"),
    diaMes: formData.get("diaMes"),
    dataFim: formData.get("dataFim"),
  });
  if (!resultado.success) return { erro: primeiroErro(resultado) };
  const d = resultado.data;

  const { error } = await supabase
    .from("financa_recorrencias")
    .update({
      tipo: d.tipo,
      valor: d.valor,
      conta_id: d.contaId,
      categoria_id: d.categoriaId,
      descricao: d.descricao,
      dia_mes: d.diaMes,
      data_fim: d.dataFim,
    })
    .eq("id", recorrenciaId);
  if (error) return { erro: error.message };

  // lançamentos dessa recorrência ainda a pagar → recebem o ajuste
  const hoje = dataAtualNoFuso();
  const { data: futuros } = await supabase
    .from("financa_transacoes")
    .select("id, data")
    .eq("recorrencia_id", recorrenciaId)
    .gt("data", hoje)
    .is("pago_em", null);
  for (const t of futuros ?? []) {
    const novaData = `${String(t.data).slice(0, 8)}${String(d.diaMes).padStart(2, "0")}`;
    await supabase
      .from("financa_transacoes")
      .update({
        tipo: d.tipo,
        valor: d.valor,
        conta_id: d.contaId,
        categoria_id: d.categoriaId,
        descricao: d.descricao,
        // muda o dia só se continuar no futuro (não vira "pago" sem querer)
        ...(novaData > hoje ? { data: novaData } : {}),
      })
      .eq("id", t.id);
  }
  // terminou antes de um lançamento futuro já criado → tira ele
  if (d.dataFim) {
    await supabase.from("financa_transacoes").delete().eq("recorrencia_id", recorrenciaId).gt("data", d.dataFim).is("pago_em", null);
  }

  revalidatePath("/financas");
  revalidatePath("/financas/recorrentes");
  return {};
}
