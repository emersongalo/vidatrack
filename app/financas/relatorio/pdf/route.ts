import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calcularSaldoPorConta } from "@/lib/financas/consulta";
import { dataAtualNoFuso } from "@/lib/tempo/fuso";
import { gerarRelatorioPdf } from "@/lib/financas/relatorioPdf";

export const dynamic = "force-dynamic";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

// Etapa 218 — relatório do mês em PDF (montado na hora, nada fica guardado)
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const hoje = dataAtualNoFuso();
  const pedido = new URL(request.url).searchParams.get("mes") ?? "";
  const mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(pedido) ? pedido : hoje.slice(0, 7);
  const [ano, m] = mes.split("-").map(Number);
  const inicio = `${mes}-01`;
  const fim = `${mes}-${String(new Date(Date.UTC(ano, m, 0)).getUTCDate()).padStart(2, "0")}`;

  const [{ data: contas }, { data: categorias }, { data: perfil }] = await Promise.all([
    supabase.from("financa_contas").select("id, nome, banco, tipo, saldo_inicial").eq("arquivado", false),
    supabase.from("financa_categorias").select("id, nome"),
    supabase.from("perfis").select("nome").eq("id", user.id).maybeSingle(),
  ]);
  const idsContas = (contas ?? []).map((c) => c.id);
  const nomesContas = new Map((contas ?? []).map((c) => [c.id, c.nome]));
  const nomesCat = new Map((categorias ?? []).map((c) => [c.id, c.nome]));

  const [{ data: doMes }, { data: todas }] = await Promise.all([
    idsContas.length
      ? supabase
          .from("financa_transacoes")
          .select("data, tipo, valor, descricao, conta_id, categoria_id, pago_em, transferencia_grupo")
          .in("conta_id", idsContas)
          .gte("data", inicio)
          .lte("data", fim)
          .order("data", { ascending: true })
          .limit(5000)
      : Promise.resolve({ data: [] as any[] }),
    idsContas.length
      ? supabase.from("financa_transacoes").select("conta_id, tipo, valor, data, pago_em, recorrencia_id, criado_em, transferencia_grupo").in("conta_id", idsContas).limit(20000)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const tipoConta = new Map((contas ?? []).map((c) => [c.id, c.tipo]));
  let receitas = 0;
  let despesas = 0;
  const porCategoria = new Map<string, number>();
  const lancamentos = (doMes ?? []).map((t) => {
    const valor = Number(t.valor);
    const ehTransf = !!t.transferencia_grupo;
    const investimento = tipoConta.get(t.conta_id) === "investimento";
    if (!ehTransf && !investimento) {
      if (t.tipo === "receita") receitas += valor;
      else {
        despesas += valor;
        const cat = t.categoria_id ? nomesCat.get(t.categoria_id) ?? "Sem categoria" : "Sem categoria";
        porCategoria.set(cat, (porCategoria.get(cat) ?? 0) + valor);
      }
    }
    return {
      data: t.data,
      descricao: t.descricao || (t.categoria_id ? nomesCat.get(t.categoria_id) ?? "" : "") || "Lançamento",
      categoria: t.categoria_id ? nomesCat.get(t.categoria_id) ?? "" : "",
      conta: nomesContas.get(t.conta_id) ?? "",
      valor,
      tipo: (ehTransf ? "transferencia" : t.tipo === "receita" ? "receita" : "despesa") as "receita" | "despesa" | "transferencia",
      pendente: t.data > hoje && !t.pago_em,
    };
  });

  const saldoContas = calcularSaldoPorConta((contas ?? []) as any, (todas ?? []) as any, hoje)
    .filter((c) => c.tipo !== "investimento" && c.tipo !== "cartao")
    .reduce((s, c) => s + c.saldo, 0);

  const agora = new Date(Date.now() - 3 * 3600 * 1000);
  const bytes = await gerarRelatorioPdf({
    nome: perfil?.nome || user.email || "",
    mesRotulo: `${MESES[m - 1]} de ${ano}`,
    geradoEm: `${hoje.split("-").reverse().join("/")} ${agora.toISOString().slice(11, 16)}`,
    receitas: Math.round(receitas * 100) / 100,
    despesas: Math.round(despesas * 100) / 100,
    saldoContas: mes === hoje.slice(0, 7) ? Math.round(saldoContas * 100) / 100 : null,
    porCategoria: [...porCategoria.entries()].map(([nome, valor]) => ({ nome, valor: Math.round(valor * 100) / 100 })).sort((a, b) => b.valor - a.valor),
    lancamentos,
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="vidatrack-relatorio-${mes}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
