import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

// Etapa 276 — convite com recompensa: quantas pessoas que entraram pelo seu
// link já usam o app de verdade (conta com 7+ dias e uso em 3+ dias
// diferentes). Só devolve números — nunca nomes ou dados de ninguém.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const admin = criarClienteAdmin("contar_indicados_ativos", "Recompensa de convite: indicados ativos");
  const limite = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: indicados } = await admin.from("perfis").select("id, criado_em").eq("indicado_por", user.id);
  const maduros = (indicados ?? []).filter((p) => String(p.criado_em) <= limite).map((p) => p.id as string);

  let ativos = 0;
  if (maduros.length) {
    const [{ data: checkins }, { data: lancamentos }] = await Promise.all([
      admin.from("habito_checkins").select("usuario_id, data").in("usuario_id", maduros).limit(5000),
      admin.from("financa_transacoes").select("dono_id, data").in("dono_id", maduros).limit(5000),
    ]);
    const dias = new Map<string, Set<string>>();
    const marcar = (id: string, dia: string) => {
      if (!dias.has(id)) dias.set(id, new Set());
      dias.get(id)!.add(dia);
    };
    for (const c of checkins ?? []) marcar(c.usuario_id as string, c.data as string);
    for (const l of lancamentos ?? []) marcar(l.dono_id as string, l.data as string);
    ativos = [...dias.values()].filter((s) => s.size >= 3).length;
  }

  return NextResponse.json(
    { indicados: (indicados ?? []).length, ativos },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
