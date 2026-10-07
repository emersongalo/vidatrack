"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { hexDaCor } from "@/lib/agenda/estilo";
import { definirCorBarraStatus } from "@/lib/app/barraStatus";
import { IconeHabito } from "@/components/IconeHabito";
import { SeletorIcone } from "@/components/SeletorIcone";
import { CORES_DISPONIVEIS } from "@/lib/agenda/estilo";

// Etapa 227 — cor clara pede texto escuro no topo colorido
function ehCorClara(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import { CampoLembretesHabito } from "@/components/CampoLembretesHabito";

type Categoria = { id: string; nome: string };

const DIAS = [
  { valor: 0, rotulo: "D" },
  { valor: 1, rotulo: "S" },
  { valor: 2, rotulo: "T" },
  { valor: 3, rotulo: "Q" },
  { valor: 4, rotulo: "Q" },
  { valor: 5, rotulo: "S" },
  { valor: 6, rotulo: "S" },
];

export function FormularioHabito({
  action,
  categorias,
  valoresIniciais,
  textoBotao,
  topo,
  outrosHabitos = [],
}: {
  /** Etapa 249 — pra escolher "fazer logo depois de…" */
  outrosHabitos?: { id: string; nome: string }[];
  /** Etapa 227 — topo colorido (na cor do hábito) com o nome em destaque */
  topo?: { titulo: string; voltarHref: string };
  action: (formData: FormData) => void;
  categorias: Categoria[];
  valoresIniciais?: {
    nome: string;
    cor: string;
    icone: string;
    frequencia: string;
    vezesSemana?: number | null;
    diasSemana: number[];
    categoriaId: string | null;
    horarioLembrete: string | null;
    /** Etapa 216 — vários horários */
    horariosLembrete?: string[] | null;
    metaDiaria: number;
    unidade: string | null;
    ehNegativo?: boolean;
    economiaDia?: number | null;
    depoisDe?: string | null;
  };
  textoBotao: string;
}) {
  const [cor, setCor] = useState(valoresIniciais?.cor ?? "habito");
  const [icone, setIcone] = useState(valoresIniciais?.icone || "Droplet");
  const [ehNegativo, setEhNegativo] = useState(valoresIniciais?.ehNegativo ?? false);
  const [frequencia, setFrequencia] = useState<"diaria" | "dias_semana" | "semanal">(
    (valoresIniciais?.frequencia as "diaria" | "dias_semana" | "semanal") ?? "diaria"
  );
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>(
    valoresIniciais?.diasSemana ?? [1, 2, 3, 4, 5]
  );
  // Etapa 216 — guarda o texto digitado (antes, apagar o "1" no celular
  // voltava na hora pra 1 e não dava pra digitar outro número)
  const [metaTexto, setMetaTexto] = useState(String(valoresIniciais?.metaDiaria ?? 1));
  const [vezesTexto, setVezesTexto] = useState(String(valoresIniciais?.vezesSemana ?? 3));
  const [unidadeTexto, setUnidadeTexto] = useState(valoresIniciais?.unidade ?? "");
  const metaDiaria = Math.max(1, Math.min(999, parseInt(metaTexto, 10) || 1));
  const vezesSemana = Math.max(1, Math.min(7, parseInt(vezesTexto, 10) || 1));
  const somarMeta = (d: number) => setMetaTexto(String(Math.max(1, Math.min(999, metaDiaria + d))));
  const somarVezes = (d: number) => setVezesTexto(String(Math.max(1, Math.min(7, vezesSemana + d))));

  const hex = hexDaCor(cor);
  const textoTopo = ehCorClara(hex) ? "text-base-900" : "text-white";
  useEffect(() => {
    if (topo) definirCorBarraStatus(hex);
  }, [hex, topo]);
  useEffect(() => () => definirCorBarraStatus(null), []);
  const selecionado = { backgroundColor: hex, borderColor: hex };
  const classeSel = ehCorClara(hex) ? "text-base-900 font-medium" : "text-white font-medium";

  function alternarDia(dia: number) {
    setDiasSelecionados((atual) =>
      atual.includes(dia) ? atual.filter((d) => d !== dia) : [...atual, dia].sort()
    );
  }

  return (
    <form action={action}>
      {topo && (
        <div className={`px-6 pt-5 pb-12 md:rounded-b-3xl transition-colors duration-300 ${textoTopo}`} style={{ backgroundColor: hex }}>
          <div className="flex items-center gap-3">
            <Link
              href={topo.voltarHref}
              aria-label="Voltar"
              className="w-11 h-11 rounded-full bg-black/15 flex items-center justify-center shrink-0"
            >
              <ChevronLeft size={22} />
            </Link>
            <p className="text-lg font-semibold">{topo.titulo}</p>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <span className="w-14 h-14 rounded-full bg-black/15 flex items-center justify-center shrink-0">
              <IconeHabito icone={icone} tamanho={26} />
            </span>
            <input
              id="nome"
              name="nome"
              type="text"
              required
              defaultValue={valoresIniciais?.nome}
              placeholder="Nome do hábito"
              aria-label="Nome do hábito"
              className={`flex-1 min-w-0 bg-transparent text-3xl font-display font-bold outline-none placeholder:text-current placeholder:opacity-60 ${textoTopo}`}
            />
          </div>
          <p className="text-sm opacity-80 mt-2">Ex: Beber água, Ler 10 páginas, Meditar</p>
        </div>
      )}
      <div className={topo ? "relative -mt-6 bg-base-900 rounded-t-3xl px-6 pt-7 pb-6 md:px-12" : ""}>
      {/* Etapa 196 — 2 colunas no desktop: o "o quê" à esquerda, o
          "quando/quanto" à direita. No celular, uma coluna só. */}
      <div className="form-colunas">
      <div className="form-coluna">
      {!topo && (
      <div>
        <label htmlFor="nome" className="block text-base font-medium mb-2">
          Nome do hábito
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          defaultValue={valoresIniciais?.nome}
          placeholder="Ex: Beber água, Ler 10 páginas, Meditar"
          className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition"
        />
      </div>
      )}

      <div>
        <span className="block text-base font-medium mb-2">Tipo de hábito</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setEhNegativo(false)}
            className={`rounded-2xl py-3.5 text-sm border transition ${
              !ehNegativo ? "bg-habito text-base-900 border-habito font-medium" : "border-base-600 text-ink-400"
            }`}
          >
            Fazer algo
          </button>
          <button
            type="button"
            onClick={() => setEhNegativo(true)}
            className={`rounded-2xl py-3.5 text-sm border transition ${
              ehNegativo ? "bg-red-400 text-base-900 border-red-400 font-medium" : "border-base-600 text-ink-400"
            }`}
          >
            Parar de fazer algo
          </button>
        </div>
        {ehNegativo && (
          <p className="text-xs text-ink-400 mt-1.5">
            Nesse tipo, você registra quando "escorregar" (ex: fumou um cigarro) — a sequência conta os
            dias limpos desde a última vez.
          </p>
        )}
        <input type="hidden" name="ehNegativo" value={ehNegativo ? "true" : "false"} />
        {/* Etapa 249 — quanto economiza por dia sem esse hábito */}
        {ehNegativo && (
          <div className="mt-4">
            <label className="block text-base font-medium mb-1">Quanto você gastava com isso por dia? (opcional)</label>
            <p className="text-xs text-ink-400 mb-2">Ex: um maço por dia ≈ R$ 12,00. A tela do hábito mostra quanto você já economizou.</p>
            <CampoValorMonetario
              name="economiaDia"
              valorInicial={valoresIniciais?.economiaDia ?? undefined}
              placeholder="0,00"
              className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 font-mono text-ink-100 focus:border-ink-100 outline-none transition"
            />
          </div>
        )}
      </div>

      <div>
        <span className="block text-base font-medium mb-2">Ícone ou emoji</span>
        <SeletorIcone tipo="habito" valor={icone} aoMudar={setIcone} name="icone" />
      </div>

      <div>
        <span className="block text-base font-medium mb-2">Cor</span>
        <div className="flex flex-wrap gap-3">
          {CORES_DISPONIVEIS.map((c) => (
            <button
              type="button"
              key={c.valor}
              onClick={() => setCor(c.valor)}
              aria-label={`Cor ${c.valor}`}
              className={`w-10 h-10 rounded-full ${c.classe} ${
                cor === c.valor ? "ring-2 ring-offset-2 ring-offset-base-900 ring-ink-100" : ""
              }`}
            />
          ))}
        </div>
        <input type="hidden" name="cor" value={cor} />
      </div>
      </div>

      <div className="form-coluna">

      {/* Etapa 249 — encadear: "depois do café → ler 10 min" */}
      {!ehNegativo && outrosHabitos.length > 0 && (
        <div>
          <label htmlFor="depoisDe" className="block text-base font-medium mb-1">
            Fazer logo depois de… (opcional)
          </label>
          <p className="text-xs text-ink-400 mb-2">Quando você marcar o outro, este aparece em destaque como o próximo.</p>
          <select
            id="depoisDe"
            name="depoisDe"
            defaultValue={valoresIniciais?.depoisDe ?? ""}
            className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition"
          >
            <option value="">Nenhum</option>
            {outrosHabitos.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      {categorias.length > 0 && (
        <div>
          <label htmlFor="categoriaId" className="block text-base font-medium mb-2">
            Categoria (opcional)
          </label>
          <select
            id="categoriaId"
            name="categoriaId"
            defaultValue={valoresIniciais?.categoriaId ?? ""}
            className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition"
          >
            <option value="">Sem categoria</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <span className="block text-base font-medium mb-2">Frequência</span>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            type="button"
            onClick={() => setFrequencia("diaria")}
            style={frequencia === "diaria" ? selecionado : undefined}
            className={`flex-1 rounded-2xl py-3 text-base border transition ${
              frequencia === "diaria" ? classeSel : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            Todos os dias
          </button>
          <button
            type="button"
            onClick={() => setFrequencia("dias_semana")}
            style={frequencia === "dias_semana" ? selecionado : undefined}
            className={`flex-1 rounded-2xl py-3 text-base border transition ${
              frequencia === "dias_semana" ? classeSel : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            Dias específicos
          </button>
          <button
            type="button"
            onClick={() => setFrequencia("semanal")}
            style={frequencia === "semanal" ? selecionado : undefined}
            className={`flex-1 rounded-2xl py-3 text-base border transition ${
              frequencia === "semanal" ? classeSel : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            X por semana
          </button>
        </div>
        {frequencia === "semanal" && (
          <div className="flex items-center gap-2 mb-1">
            <button type="button" aria-label="Menos" onClick={() => somarVezes(-1)} className="w-9 h-9 rounded-lg border border-base-600 text-lg">−</button>
            <input
              type="text"
              inputMode="numeric"
              value={vezesTexto}
              onChange={(e) => setVezesTexto(e.target.value.replace(/\D/g, "").slice(0, 1))}
              onBlur={() => setVezesTexto(String(vezesSemana))}
              className="w-12 text-center bg-base-800 border border-base-600 rounded-lg px-2 py-2 text-ink-100 font-mono outline-none focus:border-ink-100"
            />
            <input type="hidden" name="vezesSemana" value={vezesSemana} />
            <button type="button" aria-label="Mais" onClick={() => somarVezes(1)} className="w-9 h-9 rounded-lg border border-base-600 text-lg">+</button>
            <span className="text-sm text-ink-400">vezes por semana, em qualquer dia</span>
          </div>
        )}
        <input type="hidden" name="frequencia" value={frequencia} />

        {frequencia === "dias_semana" && (
          <div className="flex flex-wrap gap-2">
            {DIAS.map((dia) => (
              <button
                type="button"
                key={dia.valor}
                onClick={() => alternarDia(dia.valor)}
                style={diasSelecionados.includes(dia.valor) ? selecionado : undefined}
                className={`w-11 h-11 rounded-full text-base border transition ${
                  diasSelecionados.includes(dia.valor) ? classeSel : "border-base-600 text-ink-400 hover:text-ink-100"
                }`}
              >
                {dia.rotulo}
              </button>
            ))}
            {diasSelecionados.map((d) => (
              <input key={d} type="hidden" name="diasSemana" value={d} />
            ))}
          </div>
        )}
      </div>

      <div>
        <span className="block text-base font-medium mb-2">Meta diária (opcional)</span>
        <div className="flex gap-2 items-center">
          <button type="button" aria-label="Diminuir meta" onClick={() => somarMeta(-1)} className="w-9 h-10 rounded-lg border border-base-600 text-lg shrink-0">−</button>
          <input
            type="text"
            inputMode="numeric"
            value={metaTexto}
            onChange={(e) => setMetaTexto(e.target.value.replace(/\D/g, "").slice(0, 3))}
            onBlur={() => setMetaTexto(String(metaDiaria))}
            onFocus={(e) => e.target.select()}
            className="w-14 text-center bg-base-800 border border-base-600 rounded-lg px-2 py-2 text-ink-100 focus:border-ink-100 outline-none transition font-mono"
          />
          <input type="hidden" name="metaDiaria" value={metaDiaria} />
          <button type="button" aria-label="Aumentar meta" onClick={() => somarMeta(1)} className="w-9 h-10 rounded-lg border border-base-600 text-lg shrink-0">+</button>
          <input
            name="unidade"
            type="text"
            value={unidadeTexto}
            onChange={(e) => setUnidadeTexto(e.target.value)}
            placeholder="unidade (ex: copos, min, páginas)"
            className="flex-1 min-w-0 bg-base-800 border border-base-600 rounded-lg px-3 py-2 text-ink-100 focus:border-ink-100 outline-none transition"
          />
        </div>
        <p className="text-xs text-ink-400 mt-1">
          Deixe 1 pra um hábito simples de "feito/não feito". Acima disso,
          vira um contador (ex: 8 copos de água).
        </p>
      </div>

      <CampoLembretesHabito
        iniciais={
          valoresIniciais?.horariosLembrete?.length
            ? valoresIniciais.horariosLembrete.map((h) => h.slice(0, 5))
            : valoresIniciais?.horarioLembrete
              ? [valoresIniciais.horarioLembrete.slice(0, 5)]
              : []
        }
        ehContador={!ehNegativo && metaDiaria > 1}
        unidade={unidadeTexto.trim() || undefined}
      />

      </div>
      </div>

      <div className="form-rodape">
        <BotaoSalvarFormulario
          className={`w-full text-lg rounded-2xl py-4 hover:opacity-90 transition disabled:opacity-50 ${classeSel}`}
          estilo={{ backgroundColor: hex }}
        >
          {textoBotao}
        </BotaoSalvarFormulario>
      </div>
      </div>
    </form>
  );
}
