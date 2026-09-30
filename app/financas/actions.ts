"use server";

import { revalidatePath } from "next/cache";
import { normalizarEtiquetas } from "@/lib/financas/etiquetas";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { dividirParcelas, somarMesesISO } from "@/lib/financas/parcelas";
import {
  esquemaTransacao,
  esquemaConta,
  esquemaCategoria,
  primeiroErro,
} from "@/lib/validacao/financas";
import { lerLimite } from "@/lib/financas/limite";

/**
 * Etapa 199 — versão usada pela tela Contas: em vez de redirecionar
 * (a tela lê do retrato local e não percebia a conta nova, nem
 * mostrava o erro), devolve o resultado pra tela atualizar na hora.
 */
export async function criarContaNaTela(formData: FormData): Promise<{ erro?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const resultado = esquemaConta.safeParse({
    nome: formData.get("nome"),
    tipo: formData.get("tipo"),
    banco: formData.get("banco"),
    saldoInicial: formData.get("saldoInicial"),
    diaFechamento: formData.get("diaFechamento"),
    diaVencimento: formData.get("diaVencimento"),
  });
  if (!resultado.success) return { erro: primeiroErro(resultado) };

  const { error } = await supabase.from("financa_contas").insert({
    dono_id: user.id,
    nome: resultado.data.nome,
    tipo: resultado.data.tipo,
    banco: resultado.data.banco,
    saldo_inicial: resultado.data.saldoInicial,
    dia_fechamento: resultado.data.diaFechamento,
    dia_vencimento: resultado.data.diaVencimento,
    // Etapa 230 — limite do cartão
    limite: resultado.data.tipo === "cartao" ? lerLimite(formData.get("limite")) : null,
  });
  if (error) return { erro: error.message };

  revalidatePath("/financas");
  return {};
}

export async function criarConta(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const resultado = esquemaConta.safeParse({
    nome: formData.get("nome"),
    tipo: formData.get("tipo"),
    banco: formData.get("banco"),
    saldoInicial: formData.get("saldoInicial"),
    diaFechamento: formData.get("diaFechamento"),
    diaVencimento: formData.get("diaVencimento"),
  });

  if (!resultado.success) {
    redirect(`/financas/contas?erro=${encodeURIComponent(primeiroErro(resultado))}`);
  }

  const { error } = await supabase.from("financa_contas").insert({
    dono_id: user!.id,
    nome: resultado.data.nome,
    tipo: resultado.data.tipo,
    banco: resultado.data.banco,
    saldo_inicial: resultado.data.saldoInicial,
    dia_fechamento: resultado.data.diaFechamento,
    dia_vencimento: resultado.data.diaVencimento,
    // Etapa 230 — limite do cartão
    limite: resultado.data.tipo === "cartao" ? lerLimite(formData.get("limite")) : null,
  });

  if (error) {
    redirect(`/financas/contas?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/financas");
  redirect("/financas/contas");
}

export async function arquivarConta(contaId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("financa_contas").update({ arquivado: true }).eq("id", contaId);
  revalidatePath("/financas");
  revalidatePath("/financas/contas");
}

export async function atualizarConta(contaId: string, formData: FormData) {
  const supabase = createClient();

  const resultado = esquemaConta.safeParse({
    nome: formData.get("nome"),
    tipo: formData.get("tipo"),
    banco: formData.get("banco"),
    saldoInicial: formData.get("saldoInicial"),
    diaFechamento: formData.get("diaFechamento"),
    diaVencimento: formData.get("diaVencimento"),
  });

  if (!resultado.success) {
    redirect(`/financas/contas/${contaId}/editar?erro=${encodeURIComponent(primeiroErro(resultado))}`);
  }

  const { error } = await supabase
    .from("financa_contas")
    .update({
      nome: resultado.data.nome,
      tipo: resultado.data.tipo,
      banco: resultado.data.banco,
      saldo_inicial: resultado.data.saldoInicial,
      dia_fechamento: resultado.data.diaFechamento,
      dia_vencimento: resultado.data.diaVencimento,
      limite: resultado.data.tipo === "cartao" ? lerLimite(formData.get("limite")) : null,
    })
    .eq("id", contaId);

  if (error) {
    redirect(`/financas/contas/${contaId}/editar?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/financas");
  revalidatePath("/financas/contas");
  redirect("/financas/contas");
}

export async function restaurarConta(contaId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("financa_contas").update({ arquivado: false }).eq("id", contaId);
  revalidatePath("/financas");
  revalidatePath("/financas/contas");
  revalidatePath("/financas/contas/lixeira");
}

export async function excluirContaDefinitivamente(contaId: string) {
  "use server";
  const supabase = createClient();
  // financa_transacoes e financa_recorrencias já têm "on delete cascade"
  // pra conta_id, então somem automaticamente junto.
  await supabase.from("compartilhamentos").delete().eq("tipo_item", "financa").eq("item_id", contaId);
  await supabase.from("financa_contas").delete().eq("id", contaId);
  revalidatePath("/financas/contas/lixeira");
}

/**
 * Versão da criação de categoria que RETORNA dados em vez de
 * redirecionar — usada pelo "+ nova categoria" dentro do formulário
 * de lançamento, pra não perder o que a pessoa já tinha preenchido lá
 * (valor, conta, data...) navegando pra outra tela.
 */
export async function criarCategoriaRapida(dados: {
  nome: string;
  tipo: "receita" | "despesa";
  icone: string;
}): Promise<{ id: string; nome: string; icone: string; tipo: string } | { erro: string }> {
  "use server";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada, atualiza a página." };

  const resultado = esquemaCategoria.safeParse({
    nome: dados.nome,
    tipo: dados.tipo,
    icone: dados.icone,
    cor: "financa",
  });

  if (!resultado.success) {
    return { erro: primeiroErro(resultado) };
  }

  const { data: nova, error } = await supabase
    .from("financa_categorias")
    .insert({
      dono_id: user.id,
      nome: resultado.data.nome,
      tipo: resultado.data.tipo,
      icone: resultado.data.icone,
      cor: resultado.data.cor,
    })
    .select("id, nome, icone, tipo")
    .single();

  if (error || !nova) {
    return { erro: error?.message ?? "Não deu pra criar a categoria." };
  }

  revalidatePath("/financas/categorias");
  return nova;
}

export async function salvarOrdemBlocosFinancas(idsEmOrdem: string[]) {
  "use server";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("perfis").update({ ordem_blocos_financas: idsEmOrdem }).eq("id", user.id);
  revalidatePath("/financas");
}

export async function criarCategoria(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const resultado = esquemaCategoria.safeParse({
    nome: formData.get("nome"),
    tipo: formData.get("tipo"),
    metaMensal: formData.get("metaMensal"),
    icone: formData.get("icone"),
    cor: formData.get("cor"),
  });

  if (!resultado.success) {
    redirect(`/financas/categorias/nova?erro=${encodeURIComponent(primeiroErro(resultado))}`);
  }

  const { error } = await supabase.from("financa_categorias").insert({
    dono_id: user!.id,
    nome: resultado.data.nome,
    tipo: resultado.data.tipo,
    meta_mensal: resultado.data.metaMensal,
    icone: resultado.data.icone,
    cor: resultado.data.cor,
  });

  if (error) {
    redirect(`/financas/categorias/nova?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/financas/categorias");
  redirect("/financas/categorias");
}

export async function atualizarCategoria(categoriaId: string, formData: FormData) {
  const supabase = createClient();

  const resultado = esquemaCategoria.safeParse({
    nome: formData.get("nome"),
    tipo: formData.get("tipo"),
    metaMensal: formData.get("metaMensal"),
    icone: formData.get("icone"),
    cor: formData.get("cor"),
  });

  if (!resultado.success) {
    redirect(`/financas/categorias/${categoriaId}/editar?erro=${encodeURIComponent(primeiroErro(resultado))}`);
  }

  const { error } = await supabase
    .from("financa_categorias")
    .update({
      nome: resultado.data.nome,
      tipo: resultado.data.tipo,
      meta_mensal: resultado.data.metaMensal,
      icone: resultado.data.icone,
      cor: resultado.data.cor,
    })
    .eq("id", categoriaId);

  if (error) {
    redirect(`/financas/categorias/${categoriaId}/editar?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/financas/categorias");
  redirect("/financas/categorias");
}

export async function removerCategoria(categoriaId: string) {
  "use server";
  const supabase = createClient();
  // Lançamentos que usavam essa categoria ficam sem categoria (a coluna
  // já é "on delete set null" desde a Etapa 4) — não perde o lançamento.
  await supabase.from("financa_categorias").delete().eq("id", categoriaId);
  revalidatePath("/financas/categorias");
  revalidatePath("/financas");
}

// Etapa 218 — etiquetas livres (chegam como vários campos "etiquetas")
function etiquetasDoFormulario(formData: FormData): string[] | null {
  const lista = normalizarEtiquetas(formData.getAll("etiquetas").map(String));
  return lista.length ? lista : null;
}

function dadosTransacaoDoFormulario(formData: FormData) {
  return {
    tipo: formData.get("tipo"),
    valor: formData.get("valor"),
    contaId: formData.get("contaId"),
    categoriaId: formData.get("categoriaId"),
    descricao: formData.get("descricao"),
    data: formData.get("data") || new Date().toLocaleDateString("sv-SE"),
    recorrente: formData.get("recorrente"),
    diaMes: formData.get("diaMes"),
    dataFimRecorrencia: formData.get("dataFimRecorrencia"),
  };
}

export async function criarTransacao(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const resultado = esquemaTransacao.safeParse(dadosTransacaoDoFormulario(formData));

  if (!resultado.success) {
    redirect(`/financas/nova?erro=${encodeURIComponent(primeiroErro(resultado))}`);
  }

  // Etapa 210 — compra parcelada: cria uma parcela por mês, a partir da data escolhida
  if (formData.get("parcelado") === "on") {
    const d = resultado.data;
    const valores = dividirParcelas(d.valor, Number(formData.get("numParcelas")), formData.get("modoParcela") === "parcela" ? "parcela" : "total");
    const n = valores.length;
    const grupo = randomUUID();
    const nomeBase = d.descricao || "Compra parcelada";
    const linhas = Array.from({ length: n }, (_, i) => ({
      dono_id: user!.id,
      conta_id: d.contaId,
      categoria_id: d.categoriaId,
      tipo: d.tipo,
      valor: valores[i],
      descricao: `${nomeBase} (${i + 1}/${n})`,
      etiquetas: etiquetasDoFormulario(formData),
      data: somarMesesISO(d.data, i),
      parcela_grupo: grupo,
      parcela_numero: i + 1,
      parcela_total: n,
    }));
    const { error: erroParcelas } = await supabase.from("financa_transacoes").insert(linhas);
    if (erroParcelas) redirect(`/financas/nova?erro=${encodeURIComponent(erroParcelas.message)}`);
    revalidatePath("/financas");
    redirect("/financas");
  }

  const { data: transacaoCriada, error } = await supabase
    .from("financa_transacoes")
    .insert({
      dono_id: user!.id,
      conta_id: resultado.data.contaId,
      categoria_id: resultado.data.categoriaId,
      tipo: resultado.data.tipo,
      valor: resultado.data.valor,
      descricao: resultado.data.descricao,
      data: resultado.data.data,
      etiquetas: etiquetasDoFormulario(formData),
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/financas/nova?erro=${encodeURIComponent(error.message)}`);
  }

  // "Repetir todo mês" marcado: além do lançamento de hoje, já deixa
  // configurada a recorrência pros próximos meses (a mesma tabela que
  // a tela /financas/recorrentes usa).
  // Etapa 205 — a recorrência COMEÇA na data do lançamento ("para
  // sempre" = daquela data em diante, nunca pra trás), e esse primeiro
  // lançamento fica ligado a ela — assim o gerador automático não cria
  // de novo o mesmo mês (nem um mês anterior).
  if (resultado.data.recorrente && resultado.data.diaMes) {
    const { data: recorrencia } = await supabase
      .from("financa_recorrencias")
      .insert({
        dono_id: user!.id,
        conta_id: resultado.data.contaId,
        categoria_id: resultado.data.categoriaId,
        tipo: resultado.data.tipo,
        valor: resultado.data.valor,
        descricao: resultado.data.descricao,
        dia_mes: resultado.data.diaMes,
        data_fim: resultado.data.dataFimRecorrencia,
        data_inicio: resultado.data.data,
      })
      .select("id")
      .single();
    if (recorrencia && transacaoCriada) {
      await supabase.from("financa_transacoes").update({ recorrencia_id: recorrencia.id }).eq("id", transacaoCriada.id);
    }
  }

  revalidatePath("/financas");
  redirect("/financas");
}

/**
 * Versão silenciosa (sem `redirect`) de criar lançamento, pra fila
 * offline (Etapa 44) — não lida com recorrência, só o lançamento
 * simples, que é o caso de uso real de "lancei algo rápido sem
 * internet".
 */
export async function criarTransacaoSilenciosa(dadosFormulario: {
  tipo: string;
  valor: string;
  contaId: string;
  categoriaId: string;
  descricao: string;
  data: string;
}): Promise<{ sucesso: boolean; erro?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Sessão expirada" };

  const resultado = esquemaTransacao.safeParse({
    ...dadosFormulario,
    recorrente: null,
    diaMes: null,
    dataFimRecorrencia: null,
  });

  if (!resultado.success) return { sucesso: false, erro: primeiroErro(resultado) };

  const { error } = await supabase.from("financa_transacoes").insert({
    dono_id: user.id,
    conta_id: resultado.data.contaId,
    categoria_id: resultado.data.categoriaId,
    tipo: resultado.data.tipo,
    valor: resultado.data.valor,
    descricao: resultado.data.descricao,
    data: resultado.data.data,
  });

  revalidatePath("/financas");
  return { sucesso: !error, erro: error?.message };
}

export async function atualizarTransacao(transacaoId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const resultado = esquemaTransacao.safeParse(dadosTransacaoDoFormulario(formData));

  if (!resultado.success) {
    redirect(`/financas/${transacaoId}/editar?erro=${encodeURIComponent(primeiroErro(resultado))}`);
  }
  const d = resultado.data;

  const { error } = await supabase
    .from("financa_transacoes")
    .update({
      conta_id: d.contaId,
      categoria_id: d.categoriaId,
      tipo: d.tipo,
      valor: d.valor,
      descricao: d.descricao,
      data: d.data,
      // só mexe nas etiquetas se o formulário as enviou (Etapa 218)
      ...(formData.get("etiquetasPresente") ? { etiquetas: etiquetasDoFormulario(formData) } : {}),
    })
    .eq("id", transacaoId);

  if (error) {
    redirect(`/financas/${transacaoId}/editar?erro=${encodeURIComponent(error.message)}`);
  }

  // Etapa 210 — parcela: aplicar valor/conta/categoria às próximas
  const parcelaGrupo = String(formData.get("parcelaGrupo") ?? "");
  const parcelaNumero = Number(formData.get("parcelaNumero") ?? 0);
  if (parcelaGrupo && formData.get("aplicarParcelas") === "on") {
    await supabase
      .from("financa_transacoes")
      .update({ conta_id: d.contaId, categoria_id: d.categoriaId, tipo: d.tipo, valor: d.valor })
      .eq("parcela_grupo", parcelaGrupo)
      .gt("parcela_numero", parcelaNumero);
  }

  // Etapa 208 — lançamento que faz parte de uma recorrência
  const recorrenciaId = String(formData.get("recorrenciaId") ?? "");
  if (recorrenciaId) {
    const escopo = formData.get("escopoRecorrencia") === "so_este" ? "so_este" : "proximos";
    const parar = formData.get("pararRecorrencia") === "on";
    const mudancas: Record<string, unknown> = {};
    if (escopo === "proximos") {
      Object.assign(mudancas, {
        conta_id: d.contaId,
        categoria_id: d.categoriaId,
        tipo: d.tipo,
        valor: d.valor,
        descricao: d.descricao,
        dia_mes: Math.min(28, Number(d.data.slice(8, 10)) || 1),
      });
    }
    if (parar) mudancas.data_fim = d.data;
    if (Object.keys(mudancas).length) {
      const { error: erroRec } = await supabase.from("financa_recorrencias").update(mudancas).eq("id", recorrenciaId);
      if (erroRec) redirect(`/financas/${transacaoId}/editar?erro=${encodeURIComponent(erroRec.message)}`);
    }
    // lançamentos dessa recorrência que já existem DEPOIS deste
    if (parar) {
      await supabase.from("financa_transacoes").delete().eq("recorrencia_id", recorrenciaId).gt("data", d.data);
    } else if (escopo === "proximos") {
      await supabase
        .from("financa_transacoes")
        .update({ conta_id: d.contaId, categoria_id: d.categoriaId, tipo: d.tipo, valor: d.valor, descricao: d.descricao })
        .eq("recorrencia_id", recorrenciaId)
        .gt("data", d.data);
    }
  } else if (d.recorrente && d.diaMes) {
    // Lançamento avulso que a pessoa marcou "Repetir todo mês" ao editar
    const { data: recorrencia } = await supabase
      .from("financa_recorrencias")
      .insert({
        dono_id: user!.id,
        conta_id: d.contaId,
        categoria_id: d.categoriaId,
        tipo: d.tipo,
        valor: d.valor,
        descricao: d.descricao,
        dia_mes: d.diaMes,
        data_fim: d.dataFimRecorrencia,
        data_inicio: d.data,
      })
      .select("id")
      .single();
    if (recorrencia) {
      await supabase.from("financa_transacoes").update({ recorrencia_id: recorrencia.id }).eq("id", transacaoId);
    }
  }

  revalidatePath("/financas");
  redirect("/financas");
}

/** Etapa 210 — exclui esta parcela e as seguintes do mesmo parcelamento. */
export async function removerParcelasDaqui(transacaoId: string) {
  "use server";
  const supabase = createClient();
  const { data: t } = await supabase
    .from("financa_transacoes")
    .select("parcela_grupo, parcela_numero")
    .eq("id", transacaoId)
    .maybeSingle();
  if (!t?.parcela_grupo) {
    await supabase.from("financa_transacoes").delete().eq("id", transacaoId);
  } else {
    await supabase
      .from("financa_transacoes")
      .delete()
      .eq("parcela_grupo", t.parcela_grupo)
      .gte("parcela_numero", t.parcela_numero ?? 1);
  }
  revalidatePath("/financas");
}

/**
 * Etapa 211 — transferência entre contas (inclui pagar fatura do
 * cartão): sai de uma conta e entra na outra, as duas pontas ligadas.
 * Não conta como receita nem despesa nos totais e gráficos.
 */
export async function criarTransferencia(formData: FormData): Promise<{ erro?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const origem = String(formData.get("contaOrigemId") ?? "");
  const destino = String(formData.get("contaDestinoId") ?? "");
  const valor = Number(String(formData.get("valor") ?? "").replace(/\./g, "").replace(",", "."));
  const data = String(formData.get("data") ?? "") || new Date().toLocaleDateString("sv-SE");
  const descricao = String(formData.get("descricao") ?? "").trim().slice(0, 200);
  if (!origem || !destino) return { erro: "Escolha as duas contas" };
  if (origem === destino) return { erro: "A conta de origem e a de destino precisam ser diferentes" };
  if (!valor || valor <= 0) return { erro: "Informe um valor válido" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { erro: "Data inválida" };

  const { data: contas } = await supabase.from("financa_contas").select("id, nome").in("id", [origem, destino]);
  const nome = (id: string) => contas?.find((c) => c.id === id)?.nome ?? "conta";
  const grupo = randomUUID();
  const { error } = await supabase.from("financa_transacoes").insert([
    {
      dono_id: user.id,
      conta_id: origem,
      tipo: "despesa",
      valor,
      data,
      descricao: descricao || `Transferência para ${nome(destino)}`,
      transferencia_grupo: grupo,
    },
    {
      dono_id: user.id,
      conta_id: destino,
      tipo: "receita",
      valor,
      data,
      descricao: descricao || `Transferência de ${nome(origem)}`,
      transferencia_grupo: grupo,
    },
  ]);
  if (error) return { erro: error.message };
  revalidatePath("/financas");
  return {};
}

export async function removerTransacao(transacaoId: string) {
  "use server";
  const supabase = createClient();
  // Etapa 211 — transferência: apagar uma ponta apaga a outra junto
  const { data: t } = await supabase.from("financa_transacoes").select("transferencia_grupo").eq("id", transacaoId).maybeSingle();
  if (t?.transferencia_grupo) {
    await supabase.from("financa_transacoes").delete().eq("transferencia_grupo", t.transferencia_grupo);
    revalidatePath("/financas");
    return;
  }
  await supabase.from("financa_transacoes").delete().eq("id", transacaoId);
  revalidatePath("/financas");
}

/**
 * Transfere dinheiro de uma conta comum pra uma conta de investimento
 * — cria uma despesa na origem (categorizada como "Investimento",
 * pra aparecer identificada no extrato) e uma receita na conta de
 * investimento, ao mesmo tempo. É assim que o dinheiro "some" do
 * saldo disponível e passa a contar no total guardado.
 */
export async function transferirParaInvestimento(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const contaOrigemId = String(formData.get("contaOrigemId") ?? "");
  const contaInvestimentoId = String(formData.get("contaInvestimentoId") ?? "");
  const valor = Number(String(formData.get("valor") ?? "").replace(/\./g, "").replace(",", "."));
  const data = String(formData.get("data") ?? "") || new Date().toLocaleDateString("sv-SE");

  if (!contaOrigemId || !contaInvestimentoId || !valor || valor <= 0) {
    redirect(
      `/financas/investir?erro=${encodeURIComponent("Preencha a conta de origem, a conta de investimento e um valor válido")}`
    );
  }

  if (contaOrigemId === contaInvestimentoId) {
    redirect(`/financas/investir?erro=${encodeURIComponent("A conta de origem precisa ser diferente da de investimento")}`);
  }

  // Acha a categoria "Investimento" (criada automaticamente pra todo
  // mundo) pra já sair categorizado certo no extrato.
  const { data: categoriaInvestimento } = await supabase
    .from("financa_categorias")
    .select("id")
    .eq("dono_id", user!.id)
    .eq("nome", "Investimento")
    .eq("tipo", "despesa")
    .maybeSingle();

  const { error: erroDespesa } = await supabase.from("financa_transacoes").insert({
    dono_id: user!.id,
    conta_id: contaOrigemId,
    categoria_id: categoriaInvestimento?.id ?? null,
    tipo: "despesa",
    valor,
    descricao: "Transferência pra investimento",
    data,
  });

  if (erroDespesa) {
    redirect(`/financas/investir?erro=${encodeURIComponent(erroDespesa.message)}`);
  }

  const { error: erroReceita } = await supabase.from("financa_transacoes").insert({
    dono_id: user!.id,
    conta_id: contaInvestimentoId,
    categoria_id: null,
    tipo: "receita",
    valor,
    descricao: "Transferência recebida",
    data,
  });

  if (erroReceita) {
    // A despesa já foi criada — desfaz ela, senão o dinheiro "some"
    // sem aparecer em lugar nenhum.
    await supabase
      .from("financa_transacoes")
      .delete()
      .eq("dono_id", user!.id)
      .eq("conta_id", contaOrigemId)
      .eq("descricao", "Transferência pra investimento")
      .eq("valor", valor)
      .eq("data", data);
    redirect(`/financas/investir?erro=${encodeURIComponent(erroReceita.message)}`);
  }

  revalidatePath("/financas");
  revalidatePath("/financas/contas");
  redirect("/financas?investido=1");
}
