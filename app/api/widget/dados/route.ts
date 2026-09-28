import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calcularSaldoPorConta } from "@/lib/financas/consulta";
import { dataAtualNoFuso } from "@/lib/tempo/fuso";
import { montarDadosWidgets, somarDias } from "@/lib/widgets/dados";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Etapa 195 — chamado pelo PRÓPRIO Android (widgets), de 30 em 30 min
 * e depois de marcar um hábito pelo widget/notificação. Usa a mesma
 * sessão (cookies) do app — o Android pega os cookies da WebView —,
 * então passa pelas mesmas regras de segurança (RLS) de sempre: cada
 * pessoa só enxerga os próprios dados. Sem sessão = 401 e o widget
 * mostra "abra o app".
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const hoje = dataAtualNoFuso();
  const desde = somarDias(hoje, -400);

  const [{ data: habitos }, { data: tarefas }, { data: contas }, { data: recorrencias }] = await Promise.all([
    supabase
      .from("habitos")
      .select("id, nome, frequencia, dias_semana, meta_diaria, eh_negativo, criado_em, ordem")
      .eq("arquivado", false),
    supabase
      .from("tarefas")
      .select("id, titulo, repetir, dias_semana, data, concluida, horario_lembrete, dia_mes, mes, intervalo_dias, prioridade")
      .eq("arquivada", false),
    supabase.from("financa_contas").select("id, nome, banco, tipo, saldo_inicial").eq("arquivado", false),
    supabase.from("financa_recorrencias").select("tipo, valor, dia_mes, data_fim, data_inicio, ativo, descricao"),
  ]);

  const idsHabitos = (habitos ?? []).map((h) => h.id);
  const idsContas = (contas ?? []).map((c) => c.id);

  const [{ data: checkins }, { data: conclusoes }, { data: transacoes }] = await Promise.all([
    idsHabitos.length
      ? supabase
          .from("habito_checkins")
          .select("habito_id, data, quantidade")
          .eq("usuario_id", user.id)
          .in("habito_id", idsHabitos)
          .gte("data", desde)
      : Promise.resolve({ data: [] as any[] }),
    supabase.from("tarefa_conclusoes").select("tarefa_id, data").eq("usuario_id", user.id).eq("data", hoje),
    idsContas.length
      ? supabase.from("financa_transacoes").select("conta_id, tipo, valor, data, pago_em").in("conta_id", idsContas).limit(5000)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const dados = montarDadosWidgets({
    hoje,
    habitos: habitos ?? [],
    checkins: checkins ?? [],
    tarefas: tarefas ?? [],
    conclusoesTarefas: conclusoes ?? [],
    contas: calcularSaldoPorConta((contas ?? []) as any, transacoes ?? [], hoje),
    recorrencias: (recorrencias ?? []) as any,
    pendencias: null,
  });

  return NextResponse.json(dados, { headers: { "Cache-Control": "no-store" } });
}
