// Etapa 276 — saldo projetado dia a dia até o fim do mês (pra desenhar
// a linha): parte do saldo de hoje e aplica o que vai entrar/sair em
// cada dia. Função pura.
import type { ItemPrevisto } from "@/lib/financas/previsao";

export type PontoSaldo = { dia: string; saldo: number; entrou: number; saiu: number };

function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

export function curvaDoSaldo(saldoHoje: number, itens: ItemPrevisto[], hoje: string, ate: string): PontoSaldo[] {
  const porDia = new Map<string, { entrou: number; saiu: number }>();
  for (const i of itens) {
    // o que estava pra trás (atrasado) e ainda não caiu entra no dia de hoje
    const dia = i.data < hoje ? hoje : i.data;
    if (dia > ate) continue;
    const atual = porDia.get(dia) ?? { entrou: 0, saiu: 0 };
    if (i.tipo === "receita") atual.entrou += i.valor;
    else atual.saiu += i.valor;
    porDia.set(dia, atual);
  }
  const pontos: PontoSaldo[] = [];
  let saldo = saldoHoje;
  for (let dia = hoje, n = 0; dia <= ate && n < 62; dia = somarDias(dia, 1), n++) {
    const mov = porDia.get(dia) ?? { entrou: 0, saiu: 0 };
    saldo += mov.entrou - mov.saiu;
    pontos.push({ dia, saldo: Math.round(saldo * 100) / 100, entrou: mov.entrou, saiu: mov.saiu });
  }
  return pontos;
}
