// Etapa 352 — leitura dos formulários de conta e categoria num lugar só:
// o servidor usa pra gravar e o app usa sem internet (mesma regra).
import { esquemaConta, esquemaCategoria, primeiroErro } from "@/lib/validacao/financas";
import { lerLimite } from "@/lib/financas/limite";

type Campos = { get(n: string): FormDataEntryValue | null };

export const RE_UUID_CADASTRO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** id criado no aparelho (campo idCliente) — ou null */
export function idDoAparelho(fd: Campos): string | null {
  const v = String(fd.get("idCliente") ?? "");
  return RE_UUID_CADASTRO.test(v) ? v : null;
}

export function camposConta(fd: Campos): { erro: string } | { campos: Record<string, unknown> } {
  const r = esquemaConta.safeParse({
    nome: fd.get("nome"),
    tipo: fd.get("tipo"),
    banco: fd.get("banco"),
    saldoInicial: fd.get("saldoInicial"),
    diaFechamento: fd.get("diaFechamento"),
    diaVencimento: fd.get("diaVencimento"),
  });
  if (!r.success) return { erro: primeiroErro(r) };
  return {
    campos: {
      nome: r.data.nome,
      tipo: r.data.tipo,
      banco: r.data.banco,
      saldo_inicial: r.data.saldoInicial,
      dia_fechamento: r.data.diaFechamento,
      dia_vencimento: r.data.diaVencimento,
      // Etapa 230 — limite do cartão
      limite: r.data.tipo === "cartao" ? lerLimite(fd.get("limite")) : null,
    },
  };
}

export function camposCategoria(fd: Campos): { erro: string } | { campos: Record<string, unknown> } {
  const r = esquemaCategoria.safeParse({
    nome: fd.get("nome"),
    tipo: fd.get("tipo"),
    metaMensal: fd.get("metaMensal"),
    icone: fd.get("icone"),
    cor: fd.get("cor"),
  });
  if (!r.success) return { erro: primeiroErro(r) };
  return {
    campos: {
      nome: r.data.nome,
      tipo: r.data.tipo,
      meta_mensal: r.data.metaMensal,
      icone: r.data.icone,
      cor: r.data.cor,
    },
  };
}
