// Etapa 352 — regra dos quadradinhos do desafio (servidor e app usam a mesma)
export function gerarQuadrados(quantidade: number, tipoProgressao: string, valorTotal: number) {
  const valorBase =
    tipoProgressao === "fixo" ? valorTotal / quantidade : valorTotal / ((quantidade * (quantidade + 1)) / 2);

  const quadrados: { numero: number; valor: number }[] = [];
  for (let i = 1; i <= quantidade; i++) {
    const valorBruto = tipoProgressao === "crescente" ? valorBase * i : valorBase;
    quadrados.push({ numero: i, valor: Math.round(valorBruto * 100) / 100 });
  }

  // Arredondar cada quadrado individualmente acumula uma diferença
  // pequena no total — o último quadrado absorve essa sobra, pra
  // bater exatamente no valor que a pessoa disse que queria guardar.
  const somaAtual = quadrados.reduce((soma, q) => soma + q.valor, 0);
  const diferenca = Math.round((valorTotal - somaAtual) * 100) / 100;
  quadrados[quadrados.length - 1].valor = Math.round((quadrados[quadrados.length - 1].valor + diferenca) * 100) / 100;

  return quadrados;
}

type Campos = { get(n: string): FormDataEntryValue | null };

/** lê o formulário de novo desafio (ou devolve o erro) */
export function camposDesafio(fd: Campos) {
  const nome = String(fd.get("nome") ?? "").trim();
  const valorTotal = Number(String(fd.get("valorTotal") ?? "").replace(/\./g, "").replace(",", "."));
  const prazoQuantidade = Number(fd.get("prazoQuantidade") ?? "0");
  const tipoProgressao = String(fd.get("tipoProgressao") ?? "fixo");
  const contaOrigemId = String(fd.get("contaOrigemId") ?? "");
  if (!nome || !valorTotal || valorTotal <= 0 || !prazoQuantidade || prazoQuantidade < 2 || !contaOrigemId) {
    return { erro: "Preenche todos os campos certinho" } as const;
  }
  const quadrados = gerarQuadrados(prazoQuantidade, tipoProgressao, valorTotal);
  return {
    nome,
    prazoQuantidade,
    tipoProgressao,
    contaOrigemId,
    quadrados,
    valorAlvo: quadrados.reduce((soma, q) => soma + q.valor, 0),
    valorBase: quadrados[0].valor,
  };
}
