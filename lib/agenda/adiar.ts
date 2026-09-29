// Etapa 220 — adiar uma tarefa única direto da lista (amanhã, sábado, segunda)
function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}
function diaSemana(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}
export function opcoesAdiar(hoje: string) {
  const ate = (alvo: number) => {
    const dif = (alvo - diaSemana(hoje) + 7) % 7 || 7;
    return somarDias(hoje, dif);
  };
  const lista = [
    { rotulo: "Amanhã", data: somarDias(hoje, 1) },
    { rotulo: "Sábado", data: ate(6) },
    { rotulo: "Segunda", data: ate(1) },
    { rotulo: "+1 semana", data: somarDias(hoje, 7) },
  ];
  // sem repetir a mesma data (ex: hoje é sexta → amanhã = sábado)
  return lista.filter((o, i) => lista.findIndex((x) => x.data === o.data) === i);
}
