const CHAVE_SNAPSHOT = "vidatrack-snapshot-offline";

// Sobe esse número toda vez que o FORMATO do snapshot mudar (campo
// novo, campo renomeado/removido). Etapa 125: um retrato salvo antes
// dessa mudança não tinha "financas.transacoes" (se chamava
// "transacoesRecentes") nem "eh_negativo"/"criado_em" em cada hábito
// — o app tentava ler esses campos, não achava, e quebrava a tela
// inteira offline (ninguém tem como recarregar a página pra "resetar"
// o erro sem internet!). Com a versão conferida na leitura, um
// retrato de um formato antigo é tratado como "nunca baixado" em vez
// de travar — a pessoa só baixa o retrato certo da próxima vez que
// abrir o app com internet.
const VERSAO_SNAPSHOT = 2;

export type SnapshotOffline = {
  versao: number;
  baixadoEm: string;
  habitos: any[];
  habitoCheckins: { habito_id: string; data: string; quantidade: number }[];
  tarefas: any[];
  conclusoesTarefas: { tarefa_id: string; data: string }[];
  categoriasProdutividade: any[];
  financas: {
    contas: any[];
    categorias: any[];
    transacoes: any[];
    metas: any[];
    desafios: any[];
    desafioQuadrados: { id: string; desafio_id: string; numero: number; valor: number; completado: boolean }[];
    patrimonio: { mes: string; patrimonio: number }[];
    recorrencias: { id: string; tipo: string; valor: number; dia_mes: number; data_fim: string | null; ativo: boolean; descricao: string | null; conta_id: string }[];
    ordemBlocosFinancas: string[] | null;
  };
  perfil: { nome: string | null; email: string | null };
};

export function salvarSnapshotOffline(dados: Omit<SnapshotOffline, "versao">) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAVE_SNAPSHOT, JSON.stringify({ ...dados, versao: VERSAO_SNAPSHOT }));
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
    if (!bruto) return null;
    const dados = JSON.parse(bruto);
    // Formato antigo (ou corrompido) — trata como se nunca tivesse
    // baixado, em vez de deixar a tela quebrar tentando ler um campo
    // que não existe nesse retrato.
    if (dados?.versao !== VERSAO_SNAPSHOT) return null;

    // Segunda camada de proteção: mesmo na versão certa, garante que
    // toda lista existe como array (nunca undefined) antes de devolver
    // — assim uma tela que faz .map/.filter nesses campos nunca quebra.
    return {
      versao: dados.versao,
      baixadoEm: dados.baixadoEm ?? new Date().toISOString(),
      habitos: dados.habitos ?? [],
      habitoCheckins: dados.habitoCheckins ?? [],
      tarefas: dados.tarefas ?? [],
      conclusoesTarefas: dados.conclusoesTarefas ?? [],
      categoriasProdutividade: dados.categoriasProdutividade ?? [],
      financas: {
        contas: dados.financas?.contas ?? [],
        categorias: dados.financas?.categorias ?? [],
        transacoes: dados.financas?.transacoes ?? [],
        metas: dados.financas?.metas ?? [],
        desafios: dados.financas?.desafios ?? [],
        desafioQuadrados: dados.financas?.desafioQuadrados ?? [],
        patrimonio: dados.financas?.patrimonio ?? [],
        recorrencias: dados.financas?.recorrencias ?? [],
        ordemBlocosFinancas: dados.financas?.ordemBlocosFinancas ?? null,
      },
      perfil: {
        nome: dados.perfil?.nome ?? null,
        email: dados.perfil?.email ?? null,
      },
    };
  } catch {
    return null;
  }
}
