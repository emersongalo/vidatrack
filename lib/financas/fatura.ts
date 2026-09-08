/**
 * Dado o dia de fechamento do cartão e uma data de referência,
 * calcula qual fatura está "em aberto" nessa data — o início e o
 * fim do período que está sendo cobrado.
 *
 * Regra: se o dia da dataReferencia ainda não chegou no dia de
 * fechamento, a fatura em aberto fecha ESTE mês. Se já passou,
 * fecha no mês que vem.
 */
export function calcularPeriodoFatura(
  diaFechamento: number,
  dataReferenciaISO: string
): { inicio: string; fim: string } {
  const ref = new Date(dataReferenciaISO + "T00:00:00");
  const diaRef = ref.getDate();

  // Mês em que a fatura atual FECHA
  const mesFechamento = diaRef <= diaFechamento ? ref.getMonth() : ref.getMonth() + 1;
  const anoFechamento = ref.getFullYear();

  const fim = new Date(anoFechamento, mesFechamento, diaFechamento);
  const inicio = new Date(anoFechamento, mesFechamento - 1, diaFechamento + 1);

  return {
    inicio: inicio.toLocaleDateString("sv-SE"),
    fim: fim.toLocaleDateString("sv-SE"),
  };
}

/**
 * Dado o dia de vencimento e a data de fechamento de uma fatura,
 * calcula em que data ela vence. Se o dia de vencimento for MAIOR
 * OU IGUAL ao dia de fechamento, vence no mesmo mês do fechamento;
 * senão, vence no mês seguinte (é o padrão mais comum de cartão).
 */
export function calcularVencimentoFatura(diaVencimento: number, fimPeriodoISO: string): string {
  const fim = new Date(fimPeriodoISO + "T00:00:00");
  const diaFechamento = fim.getDate();

  const mesVencimento = diaVencimento >= diaFechamento ? fim.getMonth() : fim.getMonth() + 1;
  const vencimento = new Date(fim.getFullYear(), mesVencimento, diaVencimento);

  return vencimento.toLocaleDateString("sv-SE");
}

/** Anda uma fatura pra frente ou pra trás, a partir do fim do período atual. */
export function periodoFaturaAdjacente(
  diaFechamento: number,
  fimPeriodoAtualISO: string,
  direcao: 1 | -1
): { inicio: string; fim: string } {
  const fimAtual = new Date(fimPeriodoAtualISO + "T00:00:00");
  let referencia: Date;
  if (direcao === 1) {
    // Um dia depois do fechamento atual já cai dentro da próxima fatura.
    referencia = new Date(fimAtual);
    referencia.setDate(referencia.getDate() + 1);
  } else {
    // Precisa recuar um MÊS inteiro (não só 1 dia) — senão continua
    // dentro do mesmo período, já que o próprio dia de fechamento faz
    // parte da fatura atual.
    referencia = new Date(fimAtual.getFullYear(), fimAtual.getMonth() - 1, fimAtual.getDate());
  }
  return calcularPeriodoFatura(diaFechamento, referencia.toLocaleDateString("sv-SE"));
}
