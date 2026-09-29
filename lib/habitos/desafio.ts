// Etapa 220 — desafio em dupla: hábitos compartilhados com o placar de cada pessoa
import { calcularStreak } from "@/lib/habitos/streak";
import { pausasDe } from "@/lib/habitos/pausa";

function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

export type Placar = { usuarioId: string; sequencia: number; semana: number; hoje: boolean };

export function placarDoHabito(
  habito: any,
  checkins: { habito_id: string; data: string; quantidade?: number | null; usuario_id?: string }[],
  participantes: string[],
  hojeISO: string
): Placar[] {
  const meta = habito.meta_diaria ?? 1;
  const inicioSemana = somarDias(hojeISO, -6);
  return participantes
    .map((uid) => {
      const qtd = new Map<string, number>();
      for (const c of checkins) {
        if (c.habito_id !== habito.id || c.usuario_id !== uid) continue;
        qtd.set(c.data, (qtd.get(c.data) ?? 0) + Number(c.quantidade ?? 1));
      }
      const feitos = [...qtd.entries()].filter(([, q]) => q >= meta).map(([d]) => d);
      return {
        usuarioId: uid,
        sequencia: calcularStreak(feitos, pausasDe(habito), hojeISO),
        semana: feitos.filter((d) => d >= inicioSemana && d <= hojeISO).length,
        hoje: feitos.includes(hojeISO),
      };
    })
    .sort((a, b) => b.sequencia - a.sequencia || b.semana - a.semana);
}
