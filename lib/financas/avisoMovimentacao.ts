// Etapa 277 — conta compartilhada: quem tem acesso fica sabendo das
// movimentações (lançou um gasto, entrou uma receita, marcou como pago).
// Só roda no servidor (usa o cliente administrativo pra achar quem
// participa da conta). Quem fez a movimentação não recebe o aviso.
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { avisarUsuario } from "@/lib/push/avisarUsuario";
import { formatarMoeda } from "@/lib/financas/formatacao";

export type EventoMovimentacao = {
  acao: "lancou" | "confirmou";
  tipo: "receita" | "despesa" | string;
  valor: number;
  descricao?: string | null;
  categoriaId?: string | null;
  data?: string | null;
  /** compra parcelada: quantas parcelas */
  parcelas?: number;
  hoje?: string;
};

function ddmm(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/** Texto do aviso (função pura, testável). */
export function textoDoAviso(nome: string, conta: string, ev: EventoMovimentacao, categoria?: string | null) {
  const oQue = (ev.descricao || categoria || (ev.tipo === "receita" ? "Receita" : "Gasto")).trim();
  const valor = formatarMoeda(Math.abs(ev.valor));
  const receita = ev.tipo === "receita";
  const futuro = !!ev.data && !!ev.hoje && ev.data > ev.hoje;
  const parcelas = ev.parcelas && ev.parcelas > 1 ? ` em ${ev.parcelas}x` : "";

  if (ev.acao === "confirmou") {
    return {
      titulo: receita ? `💰 Caiu na conta ${conta}` : `✅ Pago na conta ${conta}`,
      corpo: receita ? `${nome} confirmou: ${oQue} +${valor}` : `${nome} marcou como pago: ${oQue} −${valor}`,
    };
  }
  if (receita) {
    return {
      titulo: futuro ? `📅 Receita agendada · ${conta}` : `💰 Entrou dinheiro · ${conta}`,
      corpo: `${nome} lançou ${oQue} +${valor}${futuro ? ` pra ${ddmm(ev.data!)}` : ""}`,
    };
  }
  return {
    titulo: futuro ? `📅 Conta agendada · ${conta}` : `💸 Gasto na conta ${conta}`,
    corpo: `${nome} lançou ${oQue} −${valor}${parcelas}${futuro ? ` pra ${ddmm(ev.data!)}` : ""}${categoria && ev.descricao ? ` · ${categoria}` : ""}`,
  };
}

export async function avisarMovimentacao(autorId: string, contaId: string, ev: EventoMovimentacao): Promise<number> {
  try {
    const admin = criarClienteAdmin("aviso_movimentacao", "Aviso de movimentação em conta compartilhada");
    const { data: compartilhados } = await admin
      .from("compartilhamentos")
      .select("usuario_convidado_id")
      .eq("tipo_item", "financa")
      .eq("item_id", contaId)
      .not("usuario_convidado_id", "is", null);
    if (!compartilhados?.length) return 0; // conta não compartilhada: nada a fazer

    const { data: conta } = await admin.from("financa_contas").select("nome, dono_id").eq("id", contaId).maybeSingle();
    if (!conta) return 0;

    const participantes = [conta.dono_id as string, ...compartilhados.map((c) => c.usuario_convidado_id as string)];
    const destinos = [...new Set(participantes)].filter((id) => id && id !== autorId);
    if (!destinos.length) return 0;

    const [{ data: perfis }, { data: autor }, categoria] = await Promise.all([
      admin.from("perfis").select("id, avisos_movimentacoes").in("id", destinos),
      admin.from("perfis").select("nome").eq("id", autorId).maybeSingle(),
      ev.categoriaId
        ? admin.from("financa_categorias").select("nome").eq("id", ev.categoriaId).maybeSingle().then((r) => (r.data?.nome as string) ?? null)
        : Promise.resolve(null),
    ]);
    const desligados = new Set((perfis ?? []).filter((p: any) => p.avisos_movimentacoes === false).map((p) => p.id as string));
    const nome = String(autor?.nome ?? "").trim().split(" ")[0] || "Alguém";
    const { titulo, corpo } = textoDoAviso(nome, String(conta.nome), ev, categoria);

    let enviados = 0;
    for (const id of destinos) {
      if (desligados.has(id)) continue;
      enviados += await avisarUsuario(admin, id, titulo, corpo, `/financas/extrato?conta=${contaId}`);
    }
    return enviados;
  } catch {
    return 0; // aviso é extra: nunca atrapalha o lançamento
  }
}
