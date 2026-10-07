"use client";

import { useState } from "react";
import { ICONES_CATEGORIA } from "@/lib/financas/icones-categoria";
import { ICONES_HABITO } from "@/lib/agenda/icones-habito";
import {
  EMOJIS_CATEGORIA,
  EMOJIS_HABITO,
  EMOJIS_POPULARES_CATEGORIA,
  EMOJIS_POPULARES_HABITO,
  ehEmoji,
} from "@/lib/geral/emojis";

/**
 * Etapa 272 — seletor único de ícone, usado em categorias, hábitos e
 * tarefas. Duas abas: Emojis (coloridos, por assunto) e Ícones (traço).
 * O que for escolhido vai no mesmo campo "icone" de sempre.
 */
export function SeletorIcone({
  valor,
  aoMudar,
  tipo,
  name,
  compacto = false,
}: {
  valor: string;
  aoMudar: (novo: string) => void;
  tipo: "categoria" | "habito";
  /** Quando informado, cria o <input hidden> com esse nome. */
  name?: string;
  compacto?: boolean;
}) {
  const icones = tipo === "categoria" ? ICONES_CATEGORIA : ICONES_HABITO;
  const grupos = [
    { titulo: "Populares", emojis: tipo === "categoria" ? EMOJIS_POPULARES_CATEGORIA : EMOJIS_POPULARES_HABITO },
    ...(tipo === "categoria" ? EMOJIS_CATEGORIA : EMOJIS_HABITO),
  ];

  const [aba, setAba] = useState<"emojis" | "icones">(ehEmoji(valor) || !valor ? "emojis" : "icones");
  const [grupo, setGrupo] = useState(0);
  const [colado, setColado] = useState("");

  const tamBotao = compacto ? "h-9" : "h-11";
  const grade = compacto ? "grade-icones grade-icones-compacta" : "grade-icones";

  function classeBotao(ativo: boolean) {
    return `w-full ${tamBotao} rounded-xl flex items-center justify-center border transition active:scale-95 ${
      ativo ? "border-ink-100 bg-base-700 text-ink-100 ring-1 ring-ink-100" : "border-base-600 text-ink-400 hover:border-ink-400"
    }`;
  }

  function usarColado(texto: string) {
    setColado(texto);
    const limpo = texto.trim();
    if (limpo && ehEmoji(limpo) && limpo.length <= 16) aoMudar(limpo);
  }

  return (
    <div>
      <div className="flex gap-1 p-1 bg-base-800 border border-base-600 rounded-xl mb-2.5" role="tablist">
        {(
          [
            { id: "emojis", rotulo: "😀 Emojis" },
            { id: "icones", rotulo: "✏️ Ícones" },
          ] as const
        ).map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={aba === a.id}
            onClick={() => setAba(a.id)}
            className={`flex-1 rounded-lg py-1.5 text-sm transition ${
              aba === a.id ? "bg-base-700 text-ink-100 font-medium" : "text-ink-400 hover:text-ink-100"
            }`}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      {aba === "emojis" ? (
        <>
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
            {grupos.map((g, i) => (
              <button
                key={g.titulo}
                type="button"
                onClick={() => setGrupo(i)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs border transition ${
                  grupo === i ? "bg-ink-100 text-base-900 border-ink-100" : "border-base-600 text-ink-400 hover:text-ink-100"
                }`}
              >
                {g.titulo}
              </button>
            ))}
          </div>
          <div className={grade}>
            {grupos[grupo].emojis.map((e, i) => (
              <button
                type="button"
                key={`${e}-${i}`}
                onClick={() => aoMudar(e)}
                aria-label={`Emoji ${e}`}
                className={classeBotao(valor === e)}
              >
                <span className={compacto ? "text-lg leading-none" : "text-[22px] leading-none"}>{e}</span>
              </button>
            ))}
          </div>
          {!compacto && (
            <input
              type="text"
              value={colado}
              onChange={(e) => usarColado(e.target.value)}
              maxLength={16}
              placeholder="Ou digite/cole outro emoji aqui"
              className="mt-2.5 w-full bg-base-800 border border-base-600 rounded-xl px-3 py-2 text-sm text-ink-100 focus:border-ink-100 outline-none transition"
            />
          )}
        </>
      ) : (
        <div className={grade}>
          {icones.map(({ nome, Icone }) => (
            <button
              type="button"
              key={nome}
              onClick={() => aoMudar(nome)}
              aria-label={nome}
              className={classeBotao(valor === nome)}
            >
              <Icone size={compacto ? 16 : 19} strokeWidth={2} />
            </button>
          ))}
        </div>
      )}

      {name && <input type="hidden" name={name} value={valor} />}
    </div>
  );
}
