// Etapa 306 — monta o que o jardim isométrico precisa (plantas e mascotes)
// a partir dos hábitos em dupla do retrato.
import { estagioDaPlanta, type InfoDupla } from "@/lib/habitos/dupla";
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
    ...[...pares.entries()].slice(0, 3).map(([id, p]) =>
      p.m
        ? { chave: id, nome: p.nome, cor: p.m.cor, fase: p.fase, equipados: p.m.equipados, regou: p.regou }
        : { chave: id, nome: p.nome, cor: "lilas" as const, fase: 0, equipados: {}, regou: p.regou, ovo: true }
    ),
  ];
  return { plantas, mascotes };
}
