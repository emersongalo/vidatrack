"use client";

// Etapa 319 — na apresentação: o mascote ao vivo, trocando de roupa
// sozinho. Tocou, ele pula.
import { useEffect, useState } from "react";
import { Mascote, periodoDaHora, type Periodo } from "@/components/mascote/Mascote";
import type { CorMascote, Slot } from "@/lib/mascote/mascote";

const LOOKS: { nome: string; cor: CorMascote; fase: number; equipados: Partial<Record<Slot, string>> }[] = [
  { nome: "Filhote, recém-chocado", cor: "verde", fase: 1, equipados: { fundo: "jardim" } },
  { nome: "Pronto pra praia", cor: "lilas", fase: 2, equipados: { chapeu: "palha", oculos: "escuros", mao: "sorvete", fundo: "praia" } },
  { nome: "Modo estudo", cor: "verde", fase: 3, equipados: { oculos: "nerd", mao: "livro", roupa: "gravataSocial", fundo: "quarto" } },
  { nome: "Viking da academia", cor: "lilas", fase: 3, equipados: { chapeu: "viking", mao: "halter", amigo: "dragao", fundo: "montanha" } },
  { nome: "Lendário", cor: "verde", fase: 5, equipados: { chapeu: "coroa", roupa: "faixa", mao: "trofeu", amigo: "estrelinha", fundo: "ceuarco" } },
];

export function DemoMascote() {
  const [i, setI] = useState(0);
  const [pulo, setPulo] = useState(0);
  const [periodo, setPeriodo] = useState<Periodo>("tarde");
  useEffect(() => {
    setPeriodo(periodoDaHora(new Date().getHours()));
    const t = setInterval(() => setI((x) => (x + 1) % LOOKS.length), 2800);
    return () => clearInterval(t);
  }, []);
  const l = LOOKS[i];
  return (
    <div className="bg-base-800 border border-base-700 rounded-3xl p-4 shadow-2xl shadow-black/40 text-center">
      <button type="button" onClick={() => setPulo((p) => p + 1)} className="block mx-auto" aria-label="Fazer o mascote pular">
        <div key={pulo} className={pulo ? "vtm-pulo" : ""}>
          <Mascote cor={l.cor} fase={l.fase} humor="radiante" equipados={l.equipados} tamanho={240} comFundo periodo={periodo} />
        </div>
      </button>
      <p key={l.nome} className="text-sm font-medium mt-3 animate-surgir">{l.nome}</p>
      <div className="flex justify-center gap-1.5 mt-2">
        {LOOKS.map((x, k) => (
          <span key={x.nome} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-habito" : "w-1.5 bg-base-600"}`} />
        ))}
      </div>
    </div>
  );
}
