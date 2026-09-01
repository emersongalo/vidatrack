import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { primeiroDiaDoMes } from "@/lib/financas/formatacao";

function escaparCampoCsv(valor: string): string {
  if (valor.includes(",") || valor.includes('"') || valor.includes("\n")) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const periodo = searchParams.get("periodo") ?? "mes";

  const { data: contas } = await supabase.from("financa_contas").select("id, nome");
  const { data: categorias } = await supabase.from("financa_categorias").select("id, nome");

  const mapaContas = new Map((contas ?? []).map((c) => [c.id, c.nome]));
  const mapaCategorias = new Map((categorias ?? []).map((c) => [c.id, c.nome]));
  const idsContas = (contas ?? []).map((c) => c.id);

  let consulta = supabase
    .from("financa_transacoes")
    .select("data, tipo, valor, descricao, conta_id, categoria_id")
    .in("conta_id", idsContas.length ? idsContas : ["00000000-0000-0000-0000-000000000000"])
    .order("data", { ascending: false });

  if (periodo === "mes") {
    consulta = consulta.gte("data", primeiroDiaDoMes());
  }

  const { data: transacoes } = await consulta;

  const linhas = [
    ["Data", "Tipo", "Valor", "Conta", "Categoria", "Descrição"].join(","),
    ...(transacoes ?? []).map((t) =>
      [
        t.data,
        t.tipo === "receita" ? "Receita" : "Despesa",
        String(t.valor).replace(".", ","),
        escaparCampoCsv(mapaContas.get(t.conta_id) ?? ""),
        escaparCampoCsv(t.categoria_id ? mapaCategorias.get(t.categoria_id) ?? "" : ""),
        escaparCampoCsv(t.descricao ?? ""),
      ].join(",")
    ),
  ];

  const csv = "\uFEFF" + linhas.join("\r\n"); // BOM ajuda o Excel a ler acentos certo

  const nomeArquivo = periodo === "mes" ? "vidatrack-mes-atual.csv" : "vidatrack-historico.csv";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
