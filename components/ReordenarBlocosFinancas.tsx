"use client";

import { ListaArrastavel } from "@/components/ListaArrastavel";
import { salvarOrdemBlocosFinancas } from "@/app/financas/actions";
import { NOMES_BLOCOS_FINANCAS, type BlocoFinancasId } from "@/lib/financas/blocos";

export function ReordenarBlocosFinancas({ ordemInicial }: { ordemInicial: BlocoFinancasId[] }) {
  const itens = ordemInicial.map((id) => ({ id }));

  return (
    <ListaArrastavel
      itens={itens}
      aoReordenar={(idsEmOrdem) => salvarOrdemBlocosFinancas(idsEmOrdem)}
      renderItem={(item, arrastando) => (
        <div
          className={`flex items-center gap-3 bg-base-800 border rounded-xl2 p-4 transition ${
            arrastando ? "border-financa opacity-60" : "border-base-600"
          }`}
        >
          <span className="text-ink-400 text-lg leading-none">⠿</span>
          <p className="font-medium">{NOMES_BLOCOS_FINANCAS[item.id as BlocoFinancasId]}</p>
        </div>
      )}
    />
  );
}
