import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dataAtualNoFuso } from "@/lib/tempo/fuso";
import { gerarXlsx, type Celula } from "@/lib/financas/planilhaXlsx";

export const dynamic = "force-dynamic";

// Etapa 253 — exportar em .xlsx (os acentos não quebram em nenhum app,
// valor sai como número de verdade e a data como data).
function periodoDe(nome: string, hoje: string): { de: string | null; ate: string | null; rotulo: string } {
  const [a, m] = hoje.split("-").map(Number);
  const iso = (ano: number, mes: number, dia: number) => `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  const ultimo = (ano: number, mes: number) => new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  if (nome === "mes") return { de: iso(a, m, 1), ate: iso(a, m, ultimo(a, m)), rotulo: `${a}-${String(m).padStart(2, "0")}` };
  if (nome === "mes_anterior") {
    const aa = m === 1 ? a - 1 : a;
    const mm = m === 1 ? 12 : m - 1;
    return { de: iso(aa, mm, 1), ate: iso(aa, mm, ultimo(aa, mm)), rotulo: `${aa}-${String(mm).padStart(2, "0")}` };
  }
  if (nome === "ano") return { de: iso(a, 1, 1), ate: iso(a, 12, 31), rotulo: String(a) };
  return { de: null, ate: null, rotulo: "tudo" };
}

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const hoje = dataAtualNoFuso();
  const periodo = periodoDe(searchParams.get("periodo") ?? "mes", hoje);

  const [{ data: contas }, { data: categorias }] = await Promise.all([
    supabase.from("financa_contas").select("id, nome"),
    supabase.from("financa_categorias").select("id, nome"),
  ]);
  const mapaContas = new Map((contas ?? []).map((c) => [c.id, c.nome]));
  const mapaCategorias = new Map((categorias ?? []).map((c) => [c.id, c.nome]));
  const idsContas = (contas ?? []).map((c) => c.id);

  let consulta = supabase
    .from("financa_transacoes")
    .select("data, tipo, valor, descricao, conta_id, categoria_id, pago_em, parcela_numero, parcela_total, transferencia_grupo, recorrencia_id")
    .in("conta_id", idsContas.length ? idsContas : ["00000000-0000-0000-0000-000000000000"])
    .order("data", { ascending: false })
    .limit(20000);
  if (periodo.de) consulta = consulta.gte("data", periodo.de);
  if (periodo.ate) consulta = consulta.lte("data", periodo.ate);
  const { data: transacoes } = await consulta;

  const linhas: Celula[][] = (transacoes ?? []).map((t) => [
    { data: t.data },
    t.transferencia_grupo ? "Transferência" : t.tipo === "receita" ? "Receita" : "Despesa",
    (t.tipo === "despesa" ? -1 : 1) * Number(t.valor),
    mapaContas.get(t.conta_id) ?? "",
    t.categoria_id ? mapaCategorias.get(t.categoria_id) ?? "" : "",
    t.descricao ?? "",
    t.data > hoje && !t.pago_em ? "A pagar" : "Pago",
    t.parcela_total ? `${t.parcela_numero}/${t.parcela_total}` : "",
    t.recorrencia_id ? "Sim" : "",
  ]);

  const arquivo = gerarXlsx({
    aba: "Lançamentos",
    cabecalho: ["Data", "Tipo", "Valor", "Conta", "Categoria", "Descrição", "Situação", "Parcela", "Recorrente"],
    linhas,
    larguras: [12, 14, 14, 20, 22, 32, 10, 9, 11],
    colunasDinheiro: [2],
  });

  // ArrayBuffer puro: o tipo Uint8Array não é aceito como corpo no build do Next
  const corpo = arquivo.buffer.slice(arquivo.byteOffset, arquivo.byteOffset + arquivo.byteLength) as ArrayBuffer;
  return new NextResponse(corpo, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="vidatrack-lancamentos-${periodo.rotulo}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
