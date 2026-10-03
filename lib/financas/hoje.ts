// Etapa 247 — "Quanto posso gastar hoje": um número só, pensado no
// começo do dia (o que já saiu hoje volta pra conta e depois é descontado),
// usando a previsão do mês (saldo + o que ainda entra − contas, agendados
// e faturas até o fim do mês) e, se houver, o teto de gastos.
import type { PrevisaoMes } from "@/lib/financas/previsao";
import { gastoDoMes } from "@/lib/financas/teto";
import { descricoesFrequentes, type DescricaoSugerida } from "@/lib/financas/sugestaoDescricao";

type Conta = { id: string; tipo: string; nome?: string };
type Transacao = {
  conta_id: string;
  tipo: string;
  valor: number | string;
  data: string;
  descricao?: string | null;
  categoria_id?: string | null;
  transferencia_grupo?: string | null;
  parcela_grupo?: string | null;
  recorrencia_id?: string | null;
  pago_em?: string | null;
};

export type PodeGastar = {
  /** quanto dava pra gastar hoje, no começo do dia */
  limite: number;
  /** o que já saiu hoje (inclui cartão) */
  gastouHoje: number;
  /** o que ainda dá hoje (negativo = passou) */
  restante: number;
  /** de onde veio o limite */
  motivo: "saldo" | "teto";
  /** as contas previstas já comem todo o saldo do mês */
  semFolga: boolean;
  diasRestantes: number;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

export function gastoDeHoje(contas: Conta[], transacoes: Transacao[], hojeISO: string) {
  const investimento = new Set(contas.filter((c) => c.tipo === "investimento").map((c) => c.id));
  return r2(
    transacoes
      .filter((t) => t.tipo === "despesa" && t.data === hojeISO && !t.transferencia_grupo && !investimento.has(t.conta_id))
      .reduce((s, t) => s + Number(t.valor), 0)
  );
}

export function podeGastarHoje(entrada: {
  previsao: PrevisaoMes;
  contas: Conta[];
  transacoes: Transacao[];
  hojeISO: string;
  teto?: number | null;
}): PodeGastar {
  const { previsao, contas, transacoes, hojeISO, teto } = entrada;
  const dias = Math.max(1, previsao.diasRestantes);
  const gastouHoje = gastoDeHoje(contas, transacoes, hojeISO);

  // o que tinha de folga hoje cedo (antes dos gastos de hoje)
  const folgaManha = previsao.sobra + gastouHoje;
  let limite = folgaManha / dias;
  let motivo: PodeGastar["motivo"] = "saldo";

  if (teto && teto > 0) {
    const gastoAteOntem = gastoDoMes(contas, transacoes, hojeISO) - gastouHoje;
    const peloTeto = (teto - gastoAteOntem) / dias;
    if (peloTeto < limite) {
      limite = peloTeto;
      motivo = "teto";
    }
  }

  limite = Math.max(0, r2(limite));
  return {
    limite,
    gastouHoje,
    restante: r2(limite - gastouHoje),
    motivo,
    semFolga: folgaManha <= 0,
    diasRestantes: dias,
  };
}

/**
 * Etapa 247 — os gastos que você mais repete (padaria, gasolina…),
 * pra lançar em 2 toques. Fica de fora o que é conta fixa (recorrente),
 * parcela, transferência e conta que não existe mais.
 */
export function gastosRapidos(contas: Conta[], transacoes: Transacao[], hojeISO: string, limite = 6): DescricaoSugerida[] {
  const validas = new Set(contas.filter((c) => c.tipo !== "investimento").map((c) => c.id));
  const avulsas = transacoes.filter((t) => !t.recorrencia_id && validas.has(t.conta_id));
  return descricoesFrequentes("despesa", avulsas as any, hojeISO, limite * 2)
    .filter((s) => s.contaId && validas.has(s.contaId) && s.ultimoValor > 0)
    .slice(0, limite);
}

/** "12,5" → "12,50" no formato que o formulário aceita */
export function valorParaFormulario(n: number): string {
  return n.toFixed(2).replace(".", ",");
}
