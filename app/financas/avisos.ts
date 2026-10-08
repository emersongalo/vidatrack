"use server";

// Etapa 277 — chamado pela tela depois de marcar "Paguei"/"Caiu" (a
// marcação em si é feita direto pelo app). Confere que a pessoa tem
// acesso ao lançamento e avisa quem compartilha a conta.
import { createClient } from "@/lib/supabase/server";
import { avisarMovimentacao } from "@/lib/financas/avisoMovimentacao";

export async function avisarConfirmacaoMovimentacao(transacaoId: string): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(transacaoId)) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  // lido com o cliente da pessoa: se ela não tem acesso, não acha nada
  const { data: t } = await supabase
    .from("financa_transacoes")
    .select("conta_id, tipo, valor, descricao, categoria_id, pago_em, transferencia_grupo")
    .eq("id", transacaoId)
    .maybeSingle();
  if (!t || !t.pago_em || t.transferencia_grupo) return;
  await avisarMovimentacao(user.id, t.conta_id as string, {
    acao: "confirmou",
    tipo: t.tipo as string,
    valor: Number(t.valor),
    descricao: t.descricao as string | null,
    categoriaId: t.categoria_id as string | null,
  });
}
