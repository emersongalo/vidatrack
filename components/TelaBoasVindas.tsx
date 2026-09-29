"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Plus, X, Bell, BellOff, Wallet } from "lucide-react";
import { concluirOnboarding, configurarInicio } from "@/app/bem-vindo/actions";
import { IconeHabito } from "@/components/IconeHabito";
import { BANCOS } from "@/lib/financas/bancos";
import { classeFundoSuave, classeTextoCor } from "@/lib/agenda/estilo";

/**
 * Etapa 201 — primeiro uso guiado. Antes eram 3 telas só de texto e
 * a pessoa caía num app vazio (metade dos cadastros nunca criou um
 * hábito ou uma conta). Agora, em 4 passos rápidos, ela já sai com
 * hábitos, contas e lembrete configurados.
 */

type Sugestao = { nome: string; icone: string; cor: string; negativo?: boolean };

const SUGESTOES: Sugestao[] = [
  { nome: "Beber água", icone: "Droplet", cor: "azul" },
  { nome: "Exercitar-se", icone: "Dumbbell", cor: "laranja" },
  { nome: "Ler", icone: "BookOpen", cor: "roxo" },
  { nome: "Meditar", icone: "Flower2", cor: "habito" },
  { nome: "Caminhar", icone: "Footprints", cor: "verde" },
  { nome: "Dormir cedo", icone: "Moon", cor: "nota" },
  { nome: "Acordar cedo", icone: "Sunrise", cor: "financa" },
  { nome: "Estudar", icone: "GraduationCap", cor: "azul" },
  { nome: "Comer fruta", icone: "Apple", cor: "verde" },
  { nome: "Tomar remédio", icone: "Pill", cor: "rosa" },
  { nome: "Menos celular", icone: "PhoneOff", cor: "ciano" },
  { nome: "Não fumar", icone: "Ban", cor: "rosa", negativo: true },
];

const HORARIOS = [
  { valor: "08:00", rotulo: "Manhã", sub: "08:00" },
  { valor: "12:30", rotulo: "Almoço", sub: "12:30" },
  { valor: "20:00", rotulo: "Noite", sub: "20:00" },
];

const TOTAL_PASSOS = 4;

export function TelaBoasVindas() {
  const router = useRouter();
  const [passo, setPasso] = useState(0);
  const [escolhidos, setEscolhidos] = useState<Sugestao[]>(SUGESTOES.slice(0, 3));
  const [novoNome, setNovoNome] = useState("");
  const [bancos, setBancos] = useState<string[]>([]);
  const [carteira, setCarteira] = useState(true);
  const [horario, setHorario] = useState<string | null>("20:00");
  const [horarioLivre, setHorarioLivre] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ habitos: number; contas: number } | null>(null);

  const estaEscolhido = (nome: string) => escolhidos.some((e) => e.nome === nome);
  function alternarHabito(s: Sugestao) {
    setEscolhidos((atual) => (estaEscolhido(s.nome) ? atual.filter((e) => e.nome !== s.nome) : [...atual, s]));
  }
  function adicionarProprio() {
    const nome = novoNome.trim();
    if (!nome || estaEscolhido(nome)) return;
    setEscolhidos((a) => [...a, { nome, icone: "Sparkles", cor: "habito" }]);
    setNovoNome("");
  }
  function alternarBanco(id: string) {
    setBancos((a) => (a.includes(id) ? a.filter((b) => b !== id) : [...a, id]));
  }

  async function finalizar() {
    setSalvando(true);
    setErro(null);
    try {
      const r = await configurarInicio({
        habitos: escolhidos,
        bancos,
        carteira,
        horario: horario === "livre" ? horarioLivre || null : horario,
      });
      if (r.erro) {
        setErro(r.erro);
      } else {
        setResultado({ habitos: r.habitos ?? 0, contas: r.contas ?? 0 });
        setPasso(TOTAL_PASSOS);
      }
    } catch {
      setErro("Não deu pra salvar agora. Confira a internet e tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  const proximo = () => (passo === TOTAL_PASSOS - 1 ? finalizar() : setPasso((p) => p + 1));

  // ---------- Tela final ----------
  if (passo >= TOTAL_PASSOS && resultado) {
    return (
      <Casca>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-habito/20 text-habito flex items-center justify-center mb-6">
            <Check size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-display font-semibold mb-3">Tudo pronto! 🎉</h1>
          <p className="text-ink-400 max-w-sm">
            {resultado.habitos > 0 && (
              <>
                {resultado.habitos} {resultado.habitos === 1 ? "hábito criado" : "hábitos criados"}
              </>
            )}
            {resultado.habitos > 0 && resultado.contas > 0 && " e "}
            {resultado.contas > 0 && (
              <>
                {resultado.contas} {resultado.contas === 1 ? "conta criada" : "contas criadas"}
              </>
            )}
            {resultado.habitos + resultado.contas === 0 && "Seu app está pronto pra usar"}
            . Toque num hábito na tela Hoje sempre que fizer — é assim que a sua sequência cresce.
          </p>
        </div>
        <button
          onClick={() => router.replace("/habitos")}
          className="w-full bg-ink-100 text-base-900 font-medium rounded-xl py-3.5 hover:opacity-90 transition"
        >
          Ir para Hoje
        </button>
      </Casca>
    );
  }

  return (
    <Casca>
      {/* progresso */}
      <div className="flex items-center gap-1.5 mb-8">
        {Array.from({ length: TOTAL_PASSOS }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full flex-1 transition-all ${i <= passo ? "bg-habito" : "bg-base-600"}`}
          />
        ))}
      </div>

      <div className="flex-1">
        {passo === 0 && (
          <div className="flex flex-col items-center text-center pt-6">
            <Image src="/icons/icon-192.png" alt="VidaTrack" width={104} height={104} className="rounded-3xl mb-8 shadow-lg shadow-black/40" />
            <h1 className="text-3xl font-display font-semibold mb-3">Bem-vindo ao VidaTrack</h1>
            <p className="text-ink-400 max-w-sm leading-relaxed">
              Hábitos, tarefas e finanças num lugar só. Vamos deixar tudo pronto pra você em menos de 1 minuto.
            </p>
          </div>
        )}

        {passo === 1 && (
          <div>
            <h1 className="text-3xl font-display font-bold mb-1.5">Quais hábitos você quer acompanhar?</h1>
            <p className="text-ink-400 text-sm mb-5">Escolha quantos quiser. Dá pra mudar tudo depois.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUGESTOES.map((s) => {
                const ativo = estaEscolhido(s.nome);
                return (
                  <button
                    key={s.nome}
                    type="button"
                    onClick={() => alternarHabito(s)}
                    className={`flex items-center gap-2.5 text-left rounded-xl border px-3 py-2.5 transition ${
                      ativo ? "border-habito bg-habito/10" : "border-base-600 bg-base-800 hover:border-ink-400"
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${classeFundoSuave(s.cor)} ${classeTextoCor(s.cor)}`}>
                      <IconeHabito icone={s.icone} tamanho={16} />
                    </span>
                    <span className="text-sm flex-1 min-w-0 leading-tight">{s.nome}</span>
                    {ativo && <Check size={16} className="text-habito shrink-0" />}
                  </button>
                );
              })}
              {escolhidos
                .filter((e) => !SUGESTOES.some((s) => s.nome === e.nome))
                .map((e) => (
                  <button
                    key={e.nome}
                    type="button"
                    onClick={() => alternarHabito(e)}
                    className="flex items-center gap-2.5 text-left rounded-xl border border-habito bg-habito/10 px-3 py-2.5"
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${classeFundoSuave("habito")} ${classeTextoCor("habito")}`}>
                      <IconeHabito icone="Sparkles" tamanho={16} />
                    </span>
                    <span className="text-sm flex-1 min-w-0 leading-tight">{e.nome}</span>
                    <X size={15} className="text-ink-400 shrink-0" />
                  </button>
                ))}
            </div>
            <div className="flex gap-2 mt-3">
              <input
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    adicionarProprio();
                  }
                }}
                maxLength={60}
                placeholder="Outro hábito (ex: Tocar violão)"
                className="flex-1 min-w-0 bg-base-800 border border-base-600 rounded-xl px-3 py-2.5 text-sm text-ink-100 focus:border-ink-100 outline-none transition"
              />
              <button
                type="button"
                onClick={adicionarProprio}
                aria-label="Adicionar hábito"
                className="w-11 shrink-0 rounded-xl border border-base-600 flex items-center justify-center hover:border-habito hover:text-habito transition"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        )}

        {passo === 2 && (
          <div>
            <h1 className="text-3xl font-display font-bold mb-1.5">Onde fica o seu dinheiro?</h1>
            <p className="text-ink-400 text-sm mb-5">
              Marque seus bancos pra já criarmos as contas. O saldo você ajusta depois, em Finanças → Contas.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCarteira((c) => !c)}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                  carteira ? "border-financa bg-financa/10" : "border-base-600 bg-base-800 hover:border-ink-400"
                }`}
              >
                <span className="w-8 h-8 rounded-lg bg-financa/20 text-financa flex items-center justify-center shrink-0">
                  <Wallet size={16} />
                </span>
                <span className="text-sm flex-1 leading-tight">Carteira (dinheiro)</span>
                {carteira && <Check size={16} className="text-financa shrink-0" />}
              </button>
              {BANCOS.filter((b) => b.id !== "outro").map((b) => {
                const ativo = bancos.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => alternarBanco(b.id)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                      ativo ? "border-financa bg-financa/10" : "border-base-600 bg-base-800 hover:border-ink-400"
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-white"
                      style={{ background: b.cor }}
                    >
                      {b.nome.charAt(0)}
                    </span>
                    <span className="text-sm flex-1 leading-tight">{b.nome}</span>
                    {ativo && <Check size={16} className="text-financa shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {passo === 3 && (
          <div>
            <h1 className="text-3xl font-display font-bold mb-1.5">Quando quer ser lembrado?</h1>
            <p className="text-ink-400 text-sm mb-5">
              A gente te avisa no horário escolhido pra você não esquecer dos seus hábitos.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {HORARIOS.map((h) => (
                <button
                  key={h.valor}
                  type="button"
                  onClick={() => setHorario(h.valor)}
                  className={`rounded-xl border px-3 py-4 text-center transition ${
                    horario === h.valor ? "border-habito bg-habito/10" : "border-base-600 bg-base-800 hover:border-ink-400"
                  }`}
                >
                  <Bell size={18} className={`mx-auto mb-1.5 ${horario === h.valor ? "text-habito" : "text-ink-400"}`} />
                  <p className="text-sm font-medium">{h.rotulo}</p>
                  <p className="text-xs text-ink-400 font-mono">{h.sub}</p>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <label
                className={`rounded-xl border px-3 py-2.5 flex items-center gap-2 cursor-pointer transition ${
                  horario === "livre" ? "border-habito bg-habito/10" : "border-base-600 bg-base-800"
                }`}
              >
                <span className="text-sm text-ink-400">Outro:</span>
                <input
                  type="time"
                  value={horarioLivre}
                  onChange={(e) => {
                    setHorarioLivre(e.target.value);
                    setHorario("livre");
                  }}
                  onFocus={() => setHorario("livre")}
                  className="bg-transparent text-sm text-ink-100 outline-none flex-1 min-w-0"
                />
              </label>
              <button
                type="button"
                onClick={() => setHorario(null)}
                className={`rounded-xl border px-3 py-2.5 flex items-center justify-center gap-2 text-sm transition ${
                  horario === null ? "border-ink-400 bg-base-700" : "border-base-600 bg-base-800 text-ink-400"
                }`}
              >
                <BellOff size={15} /> Sem lembrete
              </button>
            </div>

            <div className="mt-6 bg-base-800 border border-base-600 rounded-xl p-4 text-sm">
              <p className="text-ink-400 text-xs mb-2">Resumo</p>
              <p>
                <span className="text-habito font-medium">{escolhidos.length}</span>{" "}
                {escolhidos.length === 1 ? "hábito" : "hábitos"}
                {" · "}
                <span className="text-financa font-medium">{bancos.length + (carteira ? 1 : 0)}</span>{" "}
                {bancos.length + (carteira ? 1 : 0) === 1 ? "conta" : "contas"}
                {" · "}
                {horario === null ? "sem lembrete" : `lembrete às ${horario === "livre" ? horarioLivre || "--:--" : horario}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {erro && (
        <p className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">{erro}</p>
      )}

      <div className="mt-6 space-y-2">
        <button
          onClick={proximo}
          disabled={salvando}
          className="w-full bg-ink-100 text-base-900 font-medium rounded-xl py-3.5 hover:opacity-90 transition disabled:opacity-50"
        >
          {salvando ? "Preparando tudo..." : passo === 0 ? "Vamos lá" : passo === TOTAL_PASSOS - 1 ? "Concluir" : "Continuar"}
        </button>
        <div className="flex justify-between">
          {passo > 0 ? (
            <button
              type="button"
              onClick={() => setPasso((p) => p - 1)}
              className="text-sm text-ink-400 hover:text-ink-100 transition px-2 py-2"
            >
              ← Voltar
            </button>
          ) : (
            <span />
          )}
          <form action={concluirOnboarding}>
            <button type="submit" className="text-sm text-ink-400 hover:text-ink-100 transition px-2 py-2">
              Pular
            </button>
          </form>
        </div>
      </div>
    </Casca>
  );
}

function Casca({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen min-h-[100dvh] flex justify-center p-6">
      <div className="w-full max-w-xl flex flex-col py-4">{children}</div>
    </main>
  );
}
