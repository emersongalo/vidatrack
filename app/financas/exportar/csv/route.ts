import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dataAtualNoFuso } from "@/lib/tempo/fuso";

export const dynamic = "force-dynamic";

// Etapa 215 — separador ";" (o Excel em português usa vírgula como
// decimal; com "," como separador o valor "10,50" quebrava em 2 colunas).
function campo(valor: string): string {
  if (/[;"\n\r]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}

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
  const periodo = periodoDe(searchParams.get("periodo") ?? "mes", dataAtualNoFuso());

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

  const hoje = dataAtualNoFuso();
  const linhas = [
    ["Data", "Tipo", "Valor", "Conta", "Categoria", "Descrição", "Situação", "Parcela", "Recorrente"].join(";"),
    ...(transacoes ?? []).map((t) =>
      [
        t.data.split("-").reverse().join("/"),
        t.transferencia_grupo ? "Transferência" : t.tipo === "receita" ? "Receita" : "Despesa",
        (t.tipo === "despesa" ? "-" : "") + Number(t.valor).toFixed(2).replace(".", ","),
        campo(mapaContas.get(t.conta_id) ?? ""),
        campo(t.categoria_id ? mapaCategorias.get(t.categoria_id) ?? "" : ""),
        campo(t.descricao ?? ""),
        t.data > hoje && !t.pago_em ? "A pagar" : "Pago",
        t.parcela_total ? `${t.parcela_numero}/${t.parcela_total}` : "",
        t.recorrencia_id ? "Sim" : "",
      ].join(";")
    ),
  ];

  const csv = "﻿" + linhas.join("\r\n"); // BOM ajuda o Excel a ler acentos certo
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vidatrack-lancamentos-${periodo.rotulo}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
