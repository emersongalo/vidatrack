"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { analisarArquivoExtrato, type TransacaoImportada } from "@/lib/financas/importar-extrato";

export async function analisarArquivo(
  formData: FormData
): Promise<{ transacoes: TransacaoImportada[] } | { erro: string }> {
  const arquivo = formData.get("arquivo") as File | null;
  if (!arquivo || arquivo.size === 0) {
    return { erro: "Escolha um arquivo pra importar." };
  }

  const conteudo = await arquivo.text();
  return analisarArquivoExtrato(arquivo.name, conteudo);
}

/**
 * Confirma a importação — insere as transações escolhidas, mas pula
 * qualquer uma que já pareça existir na conta (mesma data + mesmo
 * valor + mesma descrição), pra não duplicar se a pessoa importar o
 * mesmo período duas vezes sem perceber.
 */
export async function confirmarImportacao(
  contaId: string,
  transacoes: TransacaoImportada[]
): Promise<{ importadas: number; ignoradasPorDuplicata: number; erro?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { importadas: 0, ignoradasPorDuplicata: 0, erro: "Sessão expirada, atualiza a página." };

  if (transacoes.length === 0) {
    return { importadas: 0, ignoradasPorDuplicata: 0, erro: "Nenhuma transação selecionada." };
  }

  const { data: existentes } = await supabase
    .from("financa_transacoes")
    .select("data, valor, descricao")
    .eq("conta_id", contaId);

  const chavesExistentes = new Set(
    (existentes ?? []).map((t) => `${t.data}|${Number(t.valor).toFixed(2)}|${(t.descricao ?? "").trim().toLowerCase()}`)
  );

  // Etapa 221 — só aceita categoria que a pessoa enxerga (dela ou de quem compartilha)
  const idsCategoria = [...new Set(transacoes.map((t) => t.categoriaId).filter(Boolean))] as string[];
  const { data: categoriasOk } = idsCategoria.length
    ? await supabase.from("financa_categorias").select("id").in("id", idsCategoria)
    : { data: [] as { id: string }[] };
  const validas = new Set((categoriasOk ?? []).map((c) => c.id));

  let ignoradasPorDuplicata = 0;
  const novas: Record<string, unknown>[] = [];

  for (const t of transacoes) {
    const chave = `${t.data}|${t.valor.toFixed(2)}|${t.descricao.trim().toLowerCase()}`;
    const chaveOriginal = t.descricaoOriginal
      ? `${t.data}|${t.valor.toFixed(2)}|${t.descricaoOriginal.trim().toLowerCase()}`
      : chave;
    if (chavesExistentes.has(chave) || chavesExistentes.has(chaveOriginal)) {
      ignoradasPorDuplicata++;
      continue;
    }
    chavesExistentes.add(chave);
    novas.push({
      dono_id: user.id,
      conta_id: contaId,
      tipo: t.tipo,
      valor: t.valor,
      descricao: t.descricao,
      data: t.data,
      categoria_id: t.categoriaId && validas.has(t.categoriaId) ? t.categoriaId : null,
    });
  }

  // Etapa 221 — grava tudo de uma vez (antes era um por um)
  let importadas = 0;
  for (let i = 0; i < novas.length; i += 200) {
    const lote = novas.slice(i, i + 200);
    const { error } = await supabase.from("financa_transacoes").insert(lote);
    if (error) return { importadas, ignoradasPorDuplicata, erro: "Parte não foi importada: " + error.message };
    importadas += lote.length;
  }

  revalidatePath("/financas");
  revalidatePath("/financas/extrato");

  return { importadas, ignoradasPorDuplicata };
}
