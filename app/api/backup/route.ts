import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dataAtualNoFuso } from "@/lib/tempo/fuso";

export const dynamic = "force-dynamic";

/**
 * Etapa 215 — cópia completa dos SEUS dados (LGPD: direito de
 * portabilidade). Só o que é da própria pessoa (dono_id / usuario_id);
 * itens que outra pessoa compartilhou com você ficam de fora.
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const eu = user.id;

  const tabelasDono = [
    "habitos",
    "tarefas",
    "notas",
    "categorias_produtividade",
    "financa_contas",
    "financa_categorias",
    "financa_transacoes",
    "financa_recorrencias",
    "metas_financeiras",
    "desafios_financeiros",
    "diario_dias",
  ] as const;

  const resultado: Record<string, unknown> = {};
  await Promise.all(
    tabelasDono.map(async (tabela) => {
      const { data, error } = await supabase.from(tabela).select("*").eq("dono_id", eu).limit(50000);
      resultado[tabela] = error ? [] : data ?? [];
    })
  );
  const [{ data: checkins }, { data: conclusoes }, { data: perfil }] = await Promise.all([
    supabase.from("habito_checkins").select("habito_id, data, quantidade, observacao, criado_em").eq("usuario_id", eu).limit(100000),
    supabase.from("tarefa_conclusoes").select("tarefa_id, data").eq("usuario_id", eu).limit(100000),
    supabase.from("perfis").select("nome, criado_em").eq("id", eu).maybeSingle(),
  ]);
  const idsDesafios = ((resultado.desafios_financeiros as any[]) ?? []).map((d) => d.id);
  const { data: quadrados } = idsDesafios.length
    ? await supabase.from("desafio_quadrados").select("*").in("desafio_id", idsDesafios)
    : { data: [] as any[] };

  const corpo = {
    app: "VidaTrack",
    formato: 1,
    geradoEm: new Date().toISOString(),
    conta: { email: user.email, nome: perfil?.nome ?? null, criadoEm: perfil?.criado_em ?? null },
    ...resultado,
    habito_checkins: checkins ?? [],
    tarefa_conclusoes: conclusoes ?? [],
    desafio_quadrados: quadrados ?? [],
  };

  return new NextResponse(JSON.stringify(corpo, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="vidatrack-backup-${dataAtualNoFuso()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
