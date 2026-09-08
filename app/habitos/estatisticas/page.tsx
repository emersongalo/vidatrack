import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/habitos/streak";
import { diaBateComFrequencia } from "@/lib/agenda/dias";
import { hexDaCor } from "@/lib/agenda/estilo";
import { IconeHabito } from "@/components/IconeHabito";
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

  // Resumo semanal: últimos 7 dias x os 7 dias antes desses — dá pra
  // ver se a semana está melhor ou pior que a passada, sem precisar
  // abrir cada hábito um por um.
  const sete7DiasAtuais = janela.slice(-7);
  const sete7DiasAnteriores = janela.slice(-14, -7);

  function calcularResumo(dias: string[]) {
    let aplicaveis = 0;
    let feitos = 0;
    const porHabito = (habitos ?? []).map((habito) => {
      const mapaDatas = checkinsPorHabito.get(habito.id) ?? new Map();
      const meta = habito.meta_diaria ?? 1;
      let aplicaveisHabito = 0;
      let feitosHabito = 0;
      for (const d of dias) {
        if (diaBateComFrequencia(habito.frequencia, habito.dias_semana ?? [], d)) {
          aplicaveisHabito++;
          if ((mapaDatas.get(d) ?? 0) >= meta) feitosHabito++;
        }
      }
      aplicaveis += aplicaveisHabito;
      feitos += feitosHabito;
      return { habito, aplicaveis: aplicaveisHabito, feitos: feitosHabito };
    });
    return {
      aplicaveis,
      feitos,
      percentual: aplicaveis ? Math.round((feitos / aplicaveis) * 100) : 0,
      porHabito,
    };
  }

  const resumoAtual = calcularResumo(sete7DiasAtuais);
  const resumoAnterior = calcularResumo(sete7DiasAnteriores);

  const comDadosEstaSemana = resumoAtual.porHabito
    .filter((p) => p.aplicaveis > 0)
    .map((p) => ({ ...p, pct: Math.round((p.feitos / p.aplicaveis) * 100) }));
  const melhorHabito = comDadosEstaSemana.length
    ? comDadosEstaSemana.reduce((a, b) => (b.pct > a.pct ? b : a))
    : null;
  const piorHabito = comDadosEstaSemana.length
    ? comDadosEstaSemana.reduce((a, b) => (b.pct < a.pct ? b : a))
    : null;

  const diferencaSemanas = resumoAtual.percentual - resumoAnterior.percentual;

  // Dicas simples, baseadas só no que realmente aconteceu — nada
  // inventado, só observações diretas dos números acima.
  const dicas: string[] = [];
  if (resumoAtual.aplicaveis === 0) {
    dicas.push("Ainda não há dados suficientes essa semana pra gerar dicas.");
  } else {
    if (resumoAnterior.aplicaveis > 0 && diferencaSemanas > 0) {
      dicas.push(`Você melhorou ${diferencaSemanas} pontos percentuais em relação à semana passada.`);
    } else if (resumoAnterior.aplicaveis > 0 && diferencaSemanas < 0) {
      dicas.push(`Essa semana caiu ${Math.abs(diferencaSemanas)} pontos percentuais em relação à passada — ainda dá tempo de virar.`);
    }
    if (melhorHabito && melhorHabito.pct === 100) {
      dicas.push(`${melhorHabito.habito.nome} está com 100% essa semana — mandou bem!`);
    }
    if (piorHabito && piorHabito.pct < 50 && piorHabito.habito.id !== melhorHabito?.habito.id) {
      dicas.push(`${piorHabito.habito.nome} está com ${piorHabito.pct}% essa semana — o que mais precisa de atenção agora.`);
    }
    if (dicas.length === 0) {
      dicas.push("Sem grandes mudanças em relação à semana passada — mantendo o ritmo.");
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto pb-16">
      <Link href="/habitos/lista" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Hábitos
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Estatísticas</h1>

      {habitos && habitos.length > 0 && (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-4 mb-6">
          <p className="text-sm text-ink-400 mb-3">Resumo da semana</p>
          <div className="flex items-end gap-6 mb-4">
            <div>
              <p className="text-3xl font-display font-bold">{resumoAtual.percentual}%</p>
              <p className="text-xs text-ink-400">Essa semana</p>
            </div>
            <div>
              <p className="text-lg font-mono text-ink-400">{resumoAnterior.percentual}%</p>
              <p className="text-xs text-ink-400">Semana passada</p>
            </div>
            {resumoAnterior.aplicaveis > 0 && diferencaSemanas !== 0 && (
              <span className={`text-sm font-medium ${diferencaSemanas > 0 ? "text-habito" : "text-red-400"}`}>
                {diferencaSemanas > 0 ? "↑" : "↓"} {Math.abs(diferencaSemanas)} pts
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {dicas.map((dica, i) => (
              <p key={i} className="text-xs text-ink-400 flex items-start gap-1.5">
                <span className="shrink-0">💡</span> {dica}
              </p>
            ))}
          </div>
        </div>
      )}

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
                    <span className="text-lg"><IconeHabito icone={habito.icone} /></span>
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
