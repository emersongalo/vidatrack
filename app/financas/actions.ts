"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  esquemaTransacao,
  esquemaConta,
  esquemaCategoria,
  primeiroErro,
} from "@/lib/validacao/financas";

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
    redirect(`/financas/categorias?erro=${encodeURIComponent(primeiroErro(resultado))}`);
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
    redirect(`/financas/categorias?erro=${encodeURIComponent(error.message)}`);
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

  const { error } = await supabase.from("financa_transacoes").insert({
    dono_id: user!.id,
    conta_id: resultado.data.contaId,
    categoria_id: resultado.data.categoriaId,
    tipo: resultado.data.tipo,
    valor: resultado.data.valor,
    descricao: resultado.data.descricao,
    data: resultado.data.data,
  });

  if (error) {
    redirect(`/financas/nova?erro=${encodeURIComponent(error.message)}`);
  }

  // "Repetir todo mês" marcado: além do lançamento de hoje, já deixa
  // configurada a recorrência pros próximos meses (a mesma tabela que
  // a tela /financas/recorrentes usa).
  if (resultado.data.recorrente && resultado.data.diaMes) {
    await supabase.from("financa_recorrencias").insert({
      dono_id: user!.id,
      conta_id: resultado.data.contaId,
      categoria_id: resultado.data.categoriaId,
      tipo: resultado.data.tipo,
      valor: resultado.data.valor,
      descricao: resultado.data.descricao,
      dia_mes: resultado.data.diaMes,
      data_fim: resultado.data.dataFimRecorrencia,
    });
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

  const resultado = esquemaTransacao.safeParse(dadosTransacaoDoFormulario(formData));

  if (!resultado.success) {
    redirect(`/financas/${transacaoId}/editar?erro=${encodeURIComponent(primeiroErro(resultado))}`);
  }

  const { error } = await supabase
    .from("financa_transacoes")
    .update({
      conta_id: resultado.data.contaId,
      categoria_id: resultado.data.categoriaId,
      tipo: resultado.data.tipo,
      valor: resultado.data.valor,
      descricao: resultado.data.descricao,
      data: resultado.data.data,
    })
    .eq("id", transacaoId);

  if (error) {
    redirect(`/financas/${transacaoId}/editar?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/financas");
  redirect("/financas");
}

export async function removerTransacao(transacaoId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("financa_transacoes").delete().eq("id", transacaoId);
  revalidatePath("/financas");
}
