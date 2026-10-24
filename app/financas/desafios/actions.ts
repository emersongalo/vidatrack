"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { camposDesafio } from "@/lib/financas/desafiosQuadrados";

// Etapa 352 — gerarQuadrados/camposDesafio moram em lib/financas/desafiosQuadrados.ts
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function criarDesafio(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const c = camposDesafio(formData);
  if ("erro" in c) {
    redirect(`/financas/desafios?erro=${encodeURIComponent(c.erro ?? "Preenche todos os campos certinho")}`);
  }
  const { nome, prazoQuantidade, tipoProgressao, contaOrigemId, quadrados, valorAlvo, valorBase } = c as Exclude<typeof c, { erro: string }>;
  // Etapa 352 — ids criados no aparelho (sem internet): reenviar não duplica
  const idCliente = String(formData.get("idCliente") ?? "");
  const idDesafio = RE_UUID.test(idCliente) ? idCliente : null;
  const idsQuadrados = formData.getAll("idQuadrado").map(String);
  const usarIdsQuadrados = idsQuadrados.length === quadrados.length && idsQuadrados.every((x) => RE_UUID.test(x));

  const { data: desafio, error } = await supabase
    .from("desafios_financeiros")
    .insert({
      ...(idDesafio ? { id: idDesafio } : {}),
      dono_id: user!.id,
      nome,
      quantidade_quadrados: prazoQuantidade,
      tipo_progressao: tipoProgressao,
      valor_base: valorBase,
      valor_alvo: valorAlvo,
      conta_origem_id: contaOrigemId,
    })
    .select("id")
    .single();

  if (error?.code === "23505" && idDesafio) {
    revalidatePath("/financas/desafios");
    redirect(`/financas/desafios/${idDesafio}`);
  }
  if (error || !desafio) {
    redirect(`/financas/desafios?erro=${encodeURIComponent(error?.message ?? "Não consegui criar o desafio")}`);
  }

  await supabase.from("desafio_quadrados").insert(
    quadrados.map((q, i) => ({ ...(usarIdsQuadrados ? { id: idsQuadrados[i] } : {}), desafio_id: desafio!.id, numero: q.numero, valor: q.valor }))
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
export async function completarQuadrado(desafioId: string, quadradoId: string, idTransacao?: string) {
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
    // Etapa 352 — id criado no aparelho (marcado sem internet)
    ...(idTransacao && RE_UUID.test(idTransacao) ? { id: idTransacao } : {}),
    dono_id: user!.id,
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
