// Etapa 227 — detalhe do hábito: resumo e histórico mês a mês.
import { calcularStreak, calcularMelhorStreak } from "@/lib/habitos/streak";
import { habitoDevidoNoDia, pausasDe } from "@/lib/habitos/pausa";

function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

export type MesHistorico = {
  mes: string; // AAAA-MM
  rotulo: string;
  feitos: number;
  devidos: number;
  /** dia do mês → "feito" | "falhou" | "folga" | "futuro" */
  dias: { dia: string; estado: "feito" | "falhou" | "folga" | "futuro" | "antes" }[];
};

export type ResumoHabito = {
  sequencia: number;
  melhor: number;
  taxa30: number | null;
  totalFeitos: number;
  meses: MesHistorico[];
};

export function resumoDoHabito(
  habito: any,
  checkins: { habito_id: string; data: string; quantidade?: number | null }[],
  hoje: string,
  quantosMeses = 6
): ResumoHabito {
  const meta = Math.max(1, Number(habito.meta_diaria) || 1);
  const qtd = new Map<string, number>();
  for (const c of checkins) if (c.habito_id === habito.id) qtd.set(c.data, (qtd.get(c.data) ?? 0) + Number(c.quantidade ?? 1));
  const feitos = [...qtd.entries()].filter(([, q]) => q >= meta).map(([d]) => d);
  const feitosSet = new Set(feitos);
  const pausas = pausasDe(habito);
  const criado = String(habito.criado_em ?? "").slice(0, 10) || "0000-00-00";

  let devidos30 = 0;
  let feitos30 = 0;
  for (let i = 0; i < 30; i++) {
    const d = somarDias(hoje, -i);
    if (d < criado || !habitoDevidoNoDia(habito, d)) continue;
    devidos30++;
    if (feitosSet.has(d)) feitos30++;
  }

  const meses: MesHistorico[] = [];
  const [a, m] = hoje.split("-").map(Number);
  for (let k = 0; k < quantosMeses; k++) {
    const inicio = new Date(Date.UTC(a, m - 1 - k, 1));
    const mes = inicio.toISOString().slice(0, 7);
    const ultimo = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, 0)).getUTCDate();
    const dias: MesHistorico["dias"] = [];
    let f = 0;
    let dv = 0;
    for (let d = 1; d <= ultimo; d++) {
      const iso = `${mes}-${String(d).padStart(2, "0")}`;
      let estado: MesHistorico["dias"][number]["estado"];
      if (iso > hoje) estado = "futuro";
      else if (iso < criado) estado = "antes";
      else if (feitosSet.has(iso)) estado = "feito";
      else if (!habitoDevidoNoDia(habito, iso)) estado = "folga";
      else estado = "falhou";
      if (estado === "feito") f++;
      if (estado === "feito" || estado === "falhou") dv++;
      dias.push({ dia: iso, estado });
    }
    if (mes < criado.slice(0, 7) && k > 0) break;
    const rot = inicio.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
    meses.push({ mes, rotulo: rot.charAt(0).toUpperCase() + rot.slice(1), feitos: f, devidos: dv, dias });
  }

  return {
    sequencia: calcularStreak(feitos, pausas, hoje),
    melhor: calcularMelhorStreak(feitos, pausas),
    taxa30: devidos30 ? Math.round((feitos30 / devidos30) * 100) : null,
    totalFeitos: feitos.length,
    meses,
  };
}
