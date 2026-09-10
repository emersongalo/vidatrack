import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calcularPatrimonioPorMes } from "@/lib/financas/patrimonio";
import { GraficoPatrimonio } from "@/components/GraficoPatrimonio";
import { formatarMoeda } from "@/lib/financas/formatacao";

export default async function PatrimonioPage() {
  const supabase = createClient();

  const [{ data: contas }, { data: transacoes }, { data: desafios }] = await Promise.all([
    supabase.from("financa_contas").select("id, saldo_inicial").eq("arquivado", false),
    supabase.from("financa_transacoes").select("conta_id, tipo, valor, data"),
    supabase.from("desafios_financeiros").select("valor_guardado").eq("arquivado", false),
  ]);

  const hoje = new Date().toLocaleDateString("sv-SE");
  const pontos = calcularPatrimonioPorMes(contas ?? [], (transacoes ?? []) as any, 12, hoje);

  // O dinheiro que já saiu da conta pra dentro de um desafio continua
  // sendo seu — soma no total atual pra não "sumir" do patrimônio.
  // (só ajusta o valor de agora; o gráfico histórico dos meses
  // passados não é retroagido, já que não guardamos quanto tinha
  // guardado em cada desafio em cada mês anterior)
  const totalEmDesafios = (desafios ?? []).reduce((soma, d) => soma + Number(d.valor_guardado), 0);
  if (pontos.length > 0) {
    pontos[pontos.length - 1].patrimonio += totalEmDesafios;
  }

  const atual = pontos[pontos.length - 1]?.patrimonio ?? 0;
  const inicial = pontos[0]?.patrimonio ?? 0;
  const variacao = atual - inicial;

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md lg:max-w-3xl mx-auto">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-1">Patrimônio líquido</h1>
      <p className="text-ink-400 text-sm mb-6">
        Tudo que você tem somado — contas, investimentos e desafios em andamento — ao longo dos últimos 12 meses.
      </p>

      <div className="bg-base-800 border border-base-600 rounded-xl2 p-4 mb-6">
        <p className="text-xs text-ink-400 mb-1">Patrimônio atual</p>
        <p className="text-3xl font-mono font-bold mb-2">{formatarMoeda(atual)}</p>
        <p className={`text-sm ${variacao >= 0 ? "text-habito" : "text-red-400"}`}>
          {variacao >= 0 ? "+" : ""}
          {formatarMoeda(variacao)} nos últimos 12 meses
        </p>
        {totalEmDesafios > 0 && (
          <p className="text-xs text-ink-400 mt-2">
            Inclui {formatarMoeda(totalEmDesafios)} guardado em desafios financeiros.
          </p>
        )}
      </div>

      <GraficoPatrimonio dados={pontos} />
    </main>
  );
}
