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
  habitoCheckins: { habito_id: string; data: string; quantidade: number; usuario_id?: string }[];
  /** Etapa 233 — check-ins das outras pessoas nos hábitos compartilhados */
  checkinsCompartilhados?: { habito_id: string; data: string; quantidade: number; usuario_id: string }[];
  /** Etapa 233 — quem faz cada hábito junto comigo */
  parceiros?: { habito_id: string; usuario_id: string; nome: string }[];
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
  perfil: { nome: string | null; email: string | null; id: string; teto_mensal?: number | null; ordem_blocos_habitos?: string[] | null };
  /** Etapa 215 — diário do dia (humor + frase). Campo novo: retrato antigo vem sem, lido como []. */
  diario?: { data: string; humor: number; texto: string | null }[];
  /** Etapa 218 — metas de longo prazo */
  metasLongas?: {
    id: string;
    nome: string;
    emoji: string | null;
    alvo: number;
    unidade: string | null;
    data_inicio: string;
    data_fim: string;
    habito_id: string | null;
    progresso: number;
  }[];
};

/**
 * Etapa 218 — o retrato agora fica no IndexedDB (sem o limite de ~5 MB
 * do localStorage, e sem travar a tela ao gravar). Pra continuar
 * funcionando igual em todo lugar que lê o retrato na hora (sem
 * await), ele fica também numa cópia em memória: carregada do
 * IndexedDB assim que o app abre (hidratarSnapshot) e atualizada a
 * cada gravação. Quem ainda tem o retrato antigo no localStorage é
 * migrado sozinho na primeira abertura.
 */
const NOME_BANCO = "vidatrack";
const LOJA = "retrato";

let cache: SnapshotOffline | null | undefined = undefined; // undefined = ainda não carregou
let hidratando: Promise<SnapshotOffline | null> | null = null;

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const pedido = indexedDB.open(NOME_BANCO, 1);
    pedido.onupgradeneeded = () => {
      if (!pedido.result.objectStoreNames.contains(LOJA)) pedido.result.createObjectStore(LOJA);
    };
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

async function lerDoBanco(): Promise<unknown> {
  const banco = await abrirBanco();
  return new Promise((resolve, reject) => {
    const req = banco.transaction(LOJA, "readonly").objectStore(LOJA).get(CHAVE_SNAPSHOT);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function gravarNoBanco(valor: unknown): Promise<void> {
  const banco = await abrirBanco();
  await new Promise<void>((resolve, reject) => {
    const tx = banco.transaction(LOJA, "readwrite");
    tx.objectStore(LOJA).put(valor, CHAVE_SNAPSHOT);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function normalizar(dados: any): SnapshotOffline | null {
  try {
    if (!dados) return null;
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
      // Etapa 233 — retrato antigo (antes da separação) vinha misturado:
      // separa aqui também, pro check-in do parceiro não contar como meu.
      habitoCheckins: (dados.habitoCheckins ?? []).filter(
        (c: any) => !c.usuario_id || !dados.perfil?.id || c.usuario_id === dados.perfil.id
      ),
      checkinsCompartilhados: [
        ...(Array.isArray(dados.checkinsCompartilhados) ? dados.checkinsCompartilhados : []),
        ...(dados.habitoCheckins ?? []).filter((c: any) => c.usuario_id && dados.perfil?.id && c.usuario_id !== dados.perfil.id),
      ],
      parceiros: Array.isArray(dados.parceiros) ? dados.parceiros : [],
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
      diario: Array.isArray(dados.diario) ? dados.diario : [],
      metasLongas: Array.isArray(dados.metasLongas) ? dados.metasLongas : [],
      perfil: {
        nome: dados.perfil?.nome ?? null,
        email: dados.perfil?.email ?? null,
        id: dados.perfil?.id ?? "",
        teto_mensal: dados.perfil?.teto_mensal != null ? Number(dados.perfil.teto_mensal) : null,
        ordem_blocos_habitos: Array.isArray(dados.perfil?.ordem_blocos_habitos) ? dados.perfil.ordem_blocos_habitos : null,
      },
    };
  } catch {
    return null;
  }
}

function lerLegado(): SnapshotOffline | null {
  try {
    const bruto = localStorage.getItem(CHAVE_SNAPSHOT);
    return bruto ? normalizar(JSON.parse(bruto)) : null;
  } catch {
    return null;
  }
}

/** Carrega o retrato do IndexedDB pra memória (uma vez por abertura do app). */
export function hidratarSnapshot(): Promise<SnapshotOffline | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (cache !== undefined) return Promise.resolve(cache);
  if (hidratando) return hidratando;
  hidratando = (async () => {
    let lido: SnapshotOffline | null = null;
    try {
      lido = normalizar(await lerDoBanco());
    } catch {
      lido = null;
    }
    if (!lido) {
      // migração: retrato antigo no localStorage vai pro IndexedDB
      const legado = lerLegado();
      if (legado) {
        lido = legado;
        try {
          await gravarNoBanco(legado);
          localStorage.removeItem(CHAVE_SNAPSHOT);
        } catch {}
      }
    }
    // alguém pode ter gravado um retrato novo enquanto carregava
    if (cache === undefined) cache = lido;
    return cache ?? null;
  })();
  return hidratando;
}

export function salvarSnapshotOffline(dados: Omit<SnapshotOffline, "versao">) {
  if (typeof window === "undefined") return;
  const completo = { ...dados, versao: VERSAO_SNAPSHOT };
  cache = normalizar(completo);
  gravarNoBanco(completo)
    .then(() => {
      try {
        localStorage.removeItem(CHAVE_SNAPSHOT);
      } catch {}
    })
    .catch(() => {
      // Sem IndexedDB (modo privado de alguns navegadores): tenta o jeito antigo
      try {
        localStorage.setItem(CHAVE_SNAPSHOT, JSON.stringify(completo));
      } catch {
        // cheio — o app volta a funcionar normal com internet
      }
    });
}

/**
 * Leitura imediata (sem await). Antes de o app terminar de carregar o
 * retrato do IndexedDB, usa o legado do localStorage se existir; as
 * telas usam useSnapshotOffline, que espera a carga terminar.
 */
export function lerSnapshotOffline(): SnapshotOffline | null {
  if (typeof window === "undefined") return null;
  if (cache !== undefined) return cache;
  return lerLegado();
}

/** true quando a cópia em memória já foi carregada. */
export function snapshotHidratado(): boolean {
  return cache !== undefined;
}

// Começa a carregar assim que qualquer tela importar este arquivo
if (typeof window !== "undefined") {
  hidratarSnapshot();
}
