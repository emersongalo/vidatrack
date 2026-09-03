const CHAVE_SNAPSHOT = "vidatrack-snapshot-offline";

export type SnapshotOffline = {
  baixadoEm: string;
  habitos: any[];
  tarefas: any[];
  categoriasProdutividade: any[];
  notas: any[];
  financas: {
    contas: any[];
    categorias: any[];
    transacoesRecentes: any[];
  };
};

export function salvarSnapshotOffline(dados: SnapshotOffline) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAVE_SNAPSHOT, JSON.stringify(dados));
  } catch {
    // Se o localStorage estiver cheio, ignora — o app volta a
    // funcionar normal assim que a conexão retornar, só o modo
    // offline completo é que fica indisponível até haver espaço.
  }
}

export function lerSnapshotOffline(): SnapshotOffline | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = localStorage.getItem(CHAVE_SNAPSHOT);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}
