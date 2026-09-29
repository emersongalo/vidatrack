// Etapa 218 — ao importar extrato do banco, acha o que você já tinha
// lançado na mão (mesmo valor e tipo, data até 3 dias de diferença),
// mesmo com descrição diferente ("PIX ENVIADO..." x "Lavagem do carro").
export type Existente = { id?: string; conta_id: string; tipo: string; valor: number | string; data: string; descricao?: string | null };
export type Importada = { tipo: string; valor: number; data: string; descricao: string };

function diasEntre(a: string, b: string) {
  return Math.abs(Math.round((Date.parse(a + "T12:00:00Z") - Date.parse(b + "T12:00:00Z")) / 86400000));
}

/** Pra cada importada, o lançamento existente que parece ser o mesmo (ou null). Cada existente casa uma vez só. */
export function acharPossiveisDuplicados(importadas: Importada[], existentes: Existente[], contaId: string, toleranciaDias = 3) {
  const usados = new Set<number>();
  const candidatos = existentes.filter((e) => e.conta_id === contaId);
  return importadas.map((imp) => {
    let melhor = -1;
    let melhorDist = Infinity;
    candidatos.forEach((e, i) => {
      if (usados.has(i) || e.tipo !== imp.tipo) return;
      if (Math.abs(Number(e.valor) - imp.valor) > 0.009) return;
      const d = diasEntre(e.data, imp.data);
      if (d <= toleranciaDias && d < melhorDist) {
        melhor = i;
        melhorDist = d;
      }
    });
    if (melhor < 0) return null;
    usados.add(melhor);
    return candidatos[melhor];
  });
}
