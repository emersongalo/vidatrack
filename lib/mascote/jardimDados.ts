// Etapa 306 — monta o que o jardim isométrico precisa (plantas e mascotes)
// a partir dos hábitos em dupla do retrato.
import { estagioDaPlanta, MAX_PESSOAS_GRUPO, type InfoDupla } from "@/lib/habitos/dupla";
import { montarJardim } from "@/lib/habitos/jardim";
import { adubosNaPlanta, DIAS_ADUBO, faseDoMascote, frutaDaPlanta, frutosParaColher, lerMascote, type DadosMascote } from "@/lib/mascote/mascote";
import type { MascoteIso, PlantaIso } from "@/components/mascote/JardimIso";

export type ParceiroMascoteDado = { usuario_id: string; mascote: unknown; feitos: number | null };

export function dadosDoJardim(
  duplas: { habito: any; info: InfoDupla }[],
  meu: DadosMascote | null,
  minhaFase: number,
  parceirosMascote: ParceiroMascoteDado[]
): { plantas: PlantaIso[]; mascotes: MascoteIso[] } {
  // pares (sem repetir) com o mascote de cada um
  const pares = new Map<string, { nome: string; m: DadosMascote | null; fase: number; regou: boolean }>();
  for (const { info } of duplas) {
    for (const p of info.parceiros) {
      const atual = pares.get(p.id);
      if (atual) {
        atual.regou = atual.regou || p.feito;
        continue;
      }
      const dado = parceirosMascote.find((x) => x.usuario_id === p.id);
      const m = lerMascote(dado?.mascote);
      pares.set(p.id, { nome: p.nome, m, fase: m ? faseDoMascote(dado?.feitos ?? 0).nivel : 0, regou: p.feito });
    }
  }
  const deles = [...pares.values()].map((p) => p.m);

  const plantas: PlantaIso[] = duplas.map(({ habito, info }) => {
    const adubos = adubosNaPlanta(meu, habito.id) + deles.reduce((s, m) => s + adubosNaPlanta(m, habito.id), 0);
    const crescimento = info.diasJuntos + adubos * DIAS_ADUBO;
    return {
      id: habito.id,
      nome: String(habito.nome ?? ""),
      estagio: estagioDaPlanta(crescimento).estagio,
      saude: info.saude,
      frutos: frutosParaColher(meu, habito.id, crescimento),
      fruta: frutaDaPlanta(habito.id),
      regada: info.euFiz || info.parceiros.some((p) => p.feito),
    };
  });

  const mascotes: MascoteIso[] = [
    meu
      ? { chave: "eu", nome: "Você", cor: meu.cor, fase: minhaFase, equipados: meu.equipados, regou: duplas.some((d) => d.info.euFiz) }
      : { chave: "eu", nome: "Você", cor: "verde", fase: 0, equipados: {}, regou: false, ovo: true },
    ...[...pares.entries()].slice(0, MAX_PESSOAS_GRUPO - 1).map(([id, p]) =>
      p.m
        ? { chave: id, nome: p.nome, cor: p.m.cor, fase: p.fase, equipados: p.m.equipados, regou: p.regou }
        : { chave: id, nome: p.nome, cor: "lilas" as const, fase: 0, equipados: {}, regou: p.regou, ovo: true }
    ),
  ];
  return { plantas, mascotes };
}

// ---- Etapa 307 — o jardim pessoal (um canteiro por hábito seu) ----

/** Nível do hábito (1–10) → como a planta é desenhada no jardim. */
export function plantaDoNivel(numero: number): Pick<PlantaIso, "estagio" | "extra"> & { frutifera: boolean } {
  const estagio = [0, 0, 1, 2, 3, 4, 5, 6, 6, 6, 6][Math.max(0, Math.min(10, numero))];
  const extra = numero >= 10 ? "lenda" : numero === 9 ? "montanha" : numero === 8 ? "floresta" : undefined;
  return { estagio, extra, frutifera: numero >= 7 };
}

/** Saúde pela última vez que fez: hoje/ontem viçosa, 2–3 dias murchando, mais que isso murcha. */
export function saudePeloUltimoDia(ultimo: string | null, hoje: string): 0 | 1 | 2 {
  if (!ultimo) return 1;
  const dias = Math.round((Date.parse(hoje + "T12:00:00Z") - Date.parse(ultimo + "T12:00:00Z")) / 86400000);
  return dias <= 1 ? 2 : dias <= 3 ? 1 : 0;
}

export function jardimPessoal(snapshot: any, hoje: string): PlantaIso[] {
  if (!snapshot) return [];
  const checkins = (snapshot.habitoCheckins ?? []) as any[];
  const plantas = montarJardim(snapshot.habitos ?? [], checkins, hoje, snapshot.perfil?.id);
  return plantas.map((p) => {
    const h = (snapshot.habitos as any[]).find((x) => x.id === p.id);
    const meta = Math.max(1, Number(h?.meta_diaria) || 1);
    const soma = new Map<string, number>();
    for (const c of checkins) if (c.habito_id === p.id) soma.set(c.data, (soma.get(c.data) ?? 0) + Number(c.quantidade ?? 1));
    const ultimo = [...soma.entries()].filter(([, q]) => q >= meta).map(([d]) => d).sort().pop() ?? null;
    const visual = plantaDoNivel(p.nivel.atual.numero);
    return {
      id: p.id,
      nome: p.nome,
      estagio: visual.estagio,
      extra: visual.extra,
      saude: saudePeloUltimoDia(ultimo, hoje),
      frutos: visual.frutifera ? 3 : 0,
      fruta: frutaDaPlanta(p.id),
      regada: p.regadaHoje,
    };
  });
}
