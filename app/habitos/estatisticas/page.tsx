import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/habitos/streak";
import { diaBateComFrequencia } from "@/lib/agenda/dias";
import { hexDaCor } from "@/lib/agenda/estilo";
import { GraficoConsistencia } from "@/components/GraficoConsistencia";

function ultimosNDias(n: number): string[] {
  const dias: string[] = [];
  const hoje = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    dias.push(d.toLocaleDateString("sv-SE"));
  }
  return dias;
}

export default async function EstatisticasHabitosPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: habitos } = await supabase
    .from("habitos")
    .select("id, nome, cor, icone, frequencia, dias_semana, meta_diaria")
    .eq("arquivado", false)
    .order("ordem");

  const idsHabitos = (habitos ?? []).map((h) => h.id);
  const janela = ultimosNDias(30);

  const { data: checkins } = idsHabitos.length
    ? await supabase
        .from("habito_checkins")
        .select("habito_id, data, quantidade")
        .eq("usuario_id", user?.id ?? "")
        .gte("data", janela[0])
        .in("habito_id", idsHabitos)
    : { data: [] as { habito_id: string; data: string; quantidade: number }[] };

  const checkinsPorHabito = new Map<string, Map<string, number>>();
  for (const c of checkins ?? []) {
    if (!checkinsPorHabito.has(c.habito_id)) checkinsPorHabito.set(c.habito_id, new Map());
    checkinsPorHabito.get(c.habito_id)!.set(c.data, c.quantidade);
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto pb-16">
      <Link href="/habitos/lista" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Hábitos
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Estatísticas</h1>

      {!habitos || habitos.length === 0 ? (
        <p className="text-ink-400 text-sm">Crie um hábito para ver as estatísticas aqui.</p>
      ) : (
        <div className="space-y-6">
          {habitos.map((habito) => {
            const mapaDatas = checkinsPorHabito.get(habito.id) ?? new Map();
            const meta = habito.meta_diaria ?? 1;

            const diasAplicaveis = janela.filter((d) =>
              diaBateComFrequencia(habito.frequencia, habito.dias_semana ?? [], d)
            );

            const dadosGrafico = janela.map((d) => ({
              dia: d.slice(8, 10),
              feito:
                diaBateComFrequencia(habito.frequencia, habito.dias_semana ?? [], d) &&
                (mapaDatas.get(d) ?? 0) >= meta
                  ? 1
                  : 0,
            }));

            const feitosNoPeriodo = diasAplicaveis.filter(
              (d) => (mapaDatas.get(d) ?? 0) >= meta
            ).length;
            const percentual = diasAplicaveis.length
              ? Math.round((feitosNoPeriodo / diasAplicaveis.length) * 100)
              : 0;

            return (
              <div key={habito.id} className="bg-base-800 border border-base-600 rounded-xl2 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{habito.icone}</span>
                    <p className="font-medium">{habito.nome}</p>
                  </div>
                  <p className="text-sm font-mono text-ink-400">
                    {percentual}% <span className="text-xs">últimos 30 dias</span>
                  </p>
                </div>
                <GraficoConsistencia dados={dadosGrafico} cor={hexDaCor(habito.cor)} />
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
