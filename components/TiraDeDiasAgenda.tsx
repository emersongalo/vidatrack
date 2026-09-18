"use client";

import { useRouter } from "next/navigation";
import { tiraDeDias } from "@/lib/agenda/dias";

export function TiraDeDiasAgenda({
  dataSelecionada,
  hojeISO,
  caminhoBase = "/habitos",
  aoSelecionarData,
}: {
  dataSelecionada: string;
  hojeISO: string;
  caminhoBase?: string;
  /** Etapa 126: quando informado, troca de dia sem navegação de
   *  página nenhuma (usado pela versão local-first de Hoje, que
   *  precisa continuar funcionando sem rede). Sem isso, cai no
   *  comportamento de sempre (router.push). */
  aoSelecionarData?: (dataISO: string) => void;
}) {
  const router = useRouter();
  const dias = tiraDeDias(dataSelecionada);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      {dias.map((dia) => {
        const selecionado = dia.iso === dataSelecionada;
        const ehHoje = dia.iso === hojeISO;
        return (
          <button
            key={dia.iso}
            onClick={() => (aoSelecionarData ? aoSelecionarData(dia.iso) : router.push(`${caminhoBase}?data=${dia.iso}`))}
            className={`flex flex-col items-center gap-1 rounded-xl2 px-3.5 py-2.5 shrink-0 transition ${
              selecionado
                ? "bg-habito text-base-900"
                : "bg-base-800 border border-base-600 text-ink-100 hover:border-habito"
            }`}
          >
            <span className={`text-xs ${selecionado ? "text-base-900/70" : "text-ink-400"}`}>
              {dia.abreviacao}
            </span>
            <span className="font-display font-semibold">{dia.numero}</span>
            {ehHoje && !selecionado && <span className="w-1 h-1 rounded-full bg-habito" />}
          </button>
        );
      })}
    </div>
  );
}
