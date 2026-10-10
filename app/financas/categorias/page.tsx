"use client";

import Link from "next/link";
import { removerCategoria } from "../actions";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { classeFundoSuave } from "@/lib/agenda/estilo";
import { IconeCategoria } from "@/components/IconeCategoria";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { MenuAcoes, ItemMenuAcoes } from "@/components/MenuAcoes";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { Pencil, Trash2 } from "lucide-react";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Dica } from "@/components/Dica";
import { CabecalhoPagina } from "@/components/CabecalhoPagina";

/**
 * Etapa 168 — redesenhada como grade de cartões com ícone circular
 * grande, inspirado no Despezzas (que mostra categoria assim, em vez
 * de uma lista de linhas finas). Editar/Remover só aparece nas suas
 * próprias — nas de quem compartilha com você, mostra só "Compartilhada".
 */
export default function CategoriasPage() {
  const { snapshot, recarregar } = useSnapshotOffline();
  const meuId = snapshot?.perfil.id;
  const categorias = [...(snapshot?.financas.categorias ?? [])].sort((a: any, b: any) =>
    a.tipo === b.tipo ? a.nome.localeCompare(b.nome) : a.tipo.localeCompare(b.tipo)
  );
  const receitas = categorias.filter((c: any) => c.tipo === "receita");
  const despesas = categorias.filter((c: any) => c.tipo === "despesa");

  function CartaoCategoria({ cat }: { cat: any }) {
    const ehMinha = cat.dono_id === meuId;
    return (
      <div
        className={`relative bg-base-800 border border-base-600 rounded-xl2 p-4 flex flex-col items-center text-center transition ${
          ehMinha ? "hover:border-ink-400 active:scale-[0.98]" : ""
        }`}
      >
        {/* Etapa 272 — o cartão inteiro abre a edição (antes só pelo menu ⋯) */}
        {ehMinha && (
          <Link
            href={`/financas/categorias/${cat.id}/editar`}
            aria-label={`Editar ${cat.nome}`}
            className="absolute inset-0 rounded-xl2 z-0"
          />
        )}
        {ehMinha ? (
          <div className="absolute top-2 right-2 z-10">
            <MenuAcoes>
              {(fecharMenu) => (
                <>
                  <ItemMenuAcoes href={`/financas/categorias/${cat.id}/editar`}>
                    <Pencil size={15} strokeWidth={2} /> Editar
                  </ItemMenuAcoes>
                  <BotaoComConfirmacao
                    acao={removerCategoria.bind(null, cat.id)}
                    textoBotao={
                      <span className="flex items-center gap-2.5">
                        <Trash2 size={15} strokeWidth={2} /> Remover
                      </span>
                    }
                    textoConfirmacao={`Remover "${cat.nome}"? Lançamentos que usam ela ficam sem categoria.`}
                    classeBotao="flex items-center w-full px-3.5 py-2 text-sm text-left text-red-400 hover:bg-base-700 transition"
                    aoConcluir={() => {
                      recarregar();
                      fecharMenu();
                    }}
                  />
                </>
              )}
            </MenuAcoes>
          </div>
        ) : (
          <span className="absolute top-2.5 right-2.5 text-[10px] text-ink-400 bg-base-700 rounded-full px-2 py-0.5">
            Compartilhada
          </span>
        )}
        <span
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-2.5 pointer-events-none ${classeFundoSuave(cat.cor)}`}
        >
          <IconeCategoria icone={cat.icone} tamanho={24} />
        </span>
        <p className="text-sm font-medium truncate max-w-full px-1 pointer-events-none">{cat.nome}</p>
        {cat.meta_mensal && (
          <p className="text-xs text-ink-400 mt-0.5 break-words max-w-full px-1 pointer-events-none">
            até {formatarMoeda(Number(cat.meta_mensal))}
          </p>
        )}
        {ehMinha && (
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-ink-400 bg-base-700 rounded-full px-2.5 py-0.5 pointer-events-none">
            <Pencil size={11} strokeWidth={2} /> Editar
          </span>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <CabecalhoPagina
        voltarHref="/financas"
        voltarTexto="Finanças"
        emoji="🏷️"
        titulo="Categorias"
        subtitulo="Toque numa categoria pra trocar nome, cor, ícone ou emoji."
        acao={
          <Link href="/financas/categorias/nova" className="botao-novo bg-financa">
            + Nova
          </Link>
        }
      />

      {despesas.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-ink-400 mb-3 uppercase tracking-wide">Despesas</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {despesas.map((cat: any) => (
              <CartaoCategoria key={cat.id} cat={cat} />
            ))}
          </div>
        </div>
      )}

      {receitas.length > 0 && (
        <div className="mb-8">
          <p className="text-xs text-ink-400 mb-3 uppercase tracking-wide">Receitas</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {receitas.map((cat: any) => (
              <CartaoCategoria key={cat.id} cat={cat} />
            ))}
          </div>
        </div>
      )}

      {snapshot !== undefined && categorias.length > 0 && <Dica contexto="orcamento" className="mt-6" />}

      {snapshot !== undefined && categorias.length === 0 && <EstadoVazio tom="financa" emoji="🏷️" titulo="Nenhuma categoria ainda" texto="Crie categorias como Mercado, Transporte e Lazer pra ver pra onde vai o dinheiro." />}
    </main>
  );
}
