// Etapa 359 — a agenda da pessoa no formato .ics, pra assinar no Google
// Agenda (ou Apple/Outlook). O Google busca esse link sozinho de tempos em
// tempos; o token no endereço é a "senha" (lib/agenda/tokenIcs).
import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { lerTokenIcs } from "@/lib/agenda/tokenIcs";
import { gerarIcs } from "@/lib/agenda/ics";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const usuarioId = lerTokenIcs(decodeURIComponent(params.token ?? ""));
  if (!usuarioId) return new NextResponse("Link inválido", { status: 404 });

  const admin = criarClienteAdmin("agenda_ics", "Calendário da agenda assinado no Google Agenda");
  const campos = "id, dono_id, titulo, descricao, local, cor, tipo, data, hora_inicio, hora_fim, repetir, repetir_ate, excecoes, lembretes";
  // meus compromissos + os que fui convidado (menos os que recusei)
  const [{ data: meus }, { data: convites }] = await Promise.all([
    admin.from("eventos").select(campos).eq("dono_id", usuarioId).limit(3000),
    admin.from("evento_participantes").select("evento_id, resposta").eq("usuario_id", usuarioId).neq("resposta", "nao_vou"),
  ]);
  const ids = (convites ?? []).map((c) => c.evento_id as string);
  const { data: deOutros } = ids.length ? await admin.from("eventos").select(campos).in("id", ids) : { data: [] as any[] };

  const ics = gerarIcs([...(meus ?? []), ...(deOutros ?? [])] as any, { nome: "VidaTrack" });
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="vidatrack.ics"',
      "Cache-Control": "private, max-age=600",
    },
  });
}
