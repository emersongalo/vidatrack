"use client";

// Etapa 354 — divisão de despesa criada sem internet (aparece na lista
// "me devem" até subir; a busca do e-mail da pessoa acontece no servidor).
import { lerFila } from "@/lib/offline/fila";
import { enfileirarAcao, novoUuid, type PedidoOffline } from "@/lib/local/acaoOffline";
import { lerSnapshotOffline } from "@/lib/offline/snapshot";

export function pendentesDivisao(): any[] {
  const transacoes = (lerSnapshotOffline()?.financas.transacoes ?? []) as any[];
  return lerFila()
    .filter((a: any) => a.tipo === "generica" && a.acao === "criarDivisao")
    .map((a: any) => {
      const campos = new Map<string, string>((a.args?.[0]?.__fd ?? []) as [string, string][]);
      const t = transacoes.find((x) => x.id === campos.get("transacaoId"));
      return {
        id: campos.get("idCliente") ?? a.id,
        participante_email: campos.get("participanteEmail"),
        valor: Number(String(campos.get("valor") ?? "").replace(/\./g, "").replace(",", ".")),
        pago: false,
        financa_transacoes: t ? { descricao: t.descricao, data: t.data } : null,
        pendente_sync: true,
      };
    });
}

export function criarDivisaoLocal(fd: FormData): string | null {
  const transacaoId = String(fd.get("transacaoId") ?? "");
  const email = String(fd.get("participanteEmail") ?? "").trim().toLowerCase();
  const valor = Number(String(fd.get("valor") ?? "").replace(/\./g, "").replace(",", "."));
  if (!transacaoId || !email || !valor || valor <= 0) return "Escolha a despesa, o e-mail da pessoa e um valor válido";
  fd.set("idCliente", novoUuid());
  const pedido: PedidoOffline = { acao: "criarDivisao", args: [fd], rotulo: `Dividir com ${email}` };
  enfileirarAcao(pedido);
  return null;
}
