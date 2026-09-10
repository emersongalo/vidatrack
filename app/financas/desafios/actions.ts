"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function gerarQuadrados(quantidade: number, tipoProgressao: string, valorTotal: number) {
  const valorBase =
    tipoProgressao === "fixo" ? valorTotal / quantidade : valorTotal / ((quantidade * (quantidade + 1)) / 2);

  const quadrados = [];
  for (let i = 1; i <= quantidade; i++) {
    const valorBruto = tipoProgressao === "crescente" ? valorBase * i : valorBase;
    quadrados.push({ numero: i, valor: Math.round(valorBruto * 100) / 100 });
  }

  // Arredondar cada quadrado individualmente acumula uma diferença
  // pequena no total — o último quadrado absorve essa sobra, pra
  // bater exatamente no valor que a pessoa disse que queria guardar.
  const somaAtual = quadrados.reduce((soma, q) => soma + q.valor, 0);
  const diferenca = Math.round((valorTotal - somaAtual) * 100) / 100;
  quadrados[quadrados.length - 1].valor = Math.round((quadrados[quadrados.length - 1].valor + diferenca) * 100) / 100;

  return quadrados;
}

export async function criarDesafio(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nome = String(formData.get("nome") ?? "").trim();
  const valorTotal = Number(String(formData.get("valorTotal") ?? "").replace(/\./g, "").replace(",", "."));
  const prazoQuantidade = Number(formData.get("prazoQuantidade") ?? "0");
  const tipoProgressao = String(formData.get("tipoProgressao") ?? "fixo");
  const contaOrigemId = String(formData.get("contaOrigemId") ?? "");

  if (!nome || !valorTotal || valorTotal <= 0 || !prazoQuantidade || prazoQuantidade < 2 || !contaOrigemId) {
    redirect(`/financas/desafios?erro=${encodeURIComponent("Preenche todos os campos certinho")}`);
  }

  // A pessoa diz quanto quer guardar e em quanto tempo — o app
  // calcula sozinho quanto cada quadrado vale, pra somar certinho
  // nesse total dentro desse prazo.
  const quadrados = gerarQuadrados(prazoQuantidade, tipoProgressao, valorTotal);
  const valorAlvo = quadrados.reduce((soma, q) => soma + q.valor, 0);
  const valorBase = quadrados[0].valor;

  const { data: desafio, error } = await supabase
    .from("desafios_financeiros")
    .insert({
      dono_id: user.id,
      nome,
      quantidade_quadrados: prazoQuantidade,
      tipo_progressao: tipoProgressao,
      valor_base: valorBase,
      valor_alvo: valorAlvo,
      conta_origem_id: contaOrigemId,
    })
    .select("id")
    .single();

  if (error || !desafio) {
    redirect(`/financas/desafios?erro=${encodeURIComponent(error?.message ?? "Não consegui criar o desafio")}`);
  }

  await supabase.from("desafio_quadrados").insert(
    quadrados.map((q) => ({ desafio_id: desafio!.id, numero: q.numero, valor: q.valor }))
  );

  revalidatePath("/financas/desafios");
  redirect(`/financas/desafios/${desafio!.id}`);
}

/**
 * Marca um quadrado como concluído — e move o dinheiro de verdade:
 * cria uma despesa na conta de origem (sai do saldo disponível, igual
 * "Guardar em investimento" já faz) e soma no total guardado do
 * desafio, que entra na conta do patrimônio líquido pra não sumir.
 */
export async function completarQuadrado(desafioId: string, quadradoId: string) {
  "use server";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: quadrado } = await supabase
    .from("desafio_quadrados")
    .select("id, valor, completado")
    .eq("id", quadradoId)
    .single();

  if (!quadrado || quadrado.completado) return;

  const { data: desafio } = await supabase
    .from("desafios_financeiros")
    .select("id, nome, conta_origem_id, valor_guardado, valor_alvo, quantidade_quadrados")
    .eq("id", desafioId)
    .single();

  if (!desafio || !desafio.conta_origem_id) return;

  await supabase.from("financa_transacoes").insert({
    dono_id: user.id,
    conta_id: desafio.conta_origem_id,
    tipo: "despesa",
    valor: quadrado.valor,
    descricao: `Desafio: ${desafio.nome}`,
    data: new Date().toLocaleDateString("sv-SE"),
  });

  await supabase
    .from("desafio_quadrados")
    .update({ completado: true, completado_em: new Date().toISOString() })
    .eq("id", quadradoId);

  const novoValorGuardado = Number(desafio.valor_guardado) + Number(quadrado.valor);

  const { count } = await supabase
    .from("desafio_quadrados")
    .select("id", { count: "exact", head: true })
    .eq("desafio_id", desafioId)
    .eq("completado", true);

  await supabase
    .from("desafios_financeiros")
    .update({
      valor_guardado: novoValorGuardado,
      concluido: (count ?? 0) >= desafio.quantidade_quadrados,
    })
    .eq("id", desafioId);

  revalidatePath(`/financas/desafios/${desafioId}`);
  revalidatePath("/financas/desafios");
  revalidatePath("/financas");
}

export async function excluirDesafio(desafioId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("desafios_financeiros").delete().eq("id", desafioId);
  revalidatePath("/financas/desafios");
  redirect("/financas/desafios");
}
