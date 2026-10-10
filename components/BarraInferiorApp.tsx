"use client";

// Etapa 230 — uma barra de baixo só pro app inteiro (celular/tablet):
// Início · Hábitos · (+) · Finanças · Perfil. O "+" do meio abre uma
// folha com tudo que dá pra criar — gasto (na hora, sem sair da tela),
// receita, transferência, hábito e tarefa. As abas de dentro de cada
// área (Contas, Extrato, Categorias...) ficam no topo (AbasArea).
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Repeat, Wallet, Plus, X, TrendingDown, TrendingUp, ArrowLeftRight, CheckSquare, Zap, CalendarDays } from "lucide-react";
import { FolhaLancamento } from "@/components/BotaoNovoLancamento";
import { vibrar } from "@/components/ItemLinhaAgenda";
import { AvisosDupla } from "@/components/AvisosDupla";

const ITENS = [
  { href: "/dashboard", rotulo: "Início", Icone: Home, cor: "text-ink-100" },
  { href: "/habitos", rotulo: "Hábitos", Icone: Repeat, cor: "text-habito" },
  null, // lugar do +
  // Etapa 264 — Tarefas virou área própria; Perfil fica no Início (foto no topo)
  { href: "/tarefas", rotulo: "Tarefas", Icone: CheckSquare, cor: "text-nota" },
  { href: "/financas", rotulo: "Finanças", Icone: Wallet, cor: "text-financa" },
] as const;

export function areaAtiva(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BarraInferiorApp() {
  const pathname = usePathname() ?? "";
  const [menu, setMenu] = useState(false);
  const [gasto, setGasto] = useState(false);
  // Etapa 281/283 — "+" abre um cartão com gasto, tarefa, hábito e "mais"
  const [leque, setLeque] = useState(false);
  const indiceAtivo = ITENS.findIndex((it) => it !== null && areaAtiva(pathname, it.href));
  const itemAtivo = indiceAtivo >= 0 ? ITENS[indiceAtivo] : null;
  const COR_PILULA: Record<string, string> = {
    "/dashboard": "bg-ink-100/10",
    "/habitos": "bg-habito/15",
    "/tarefas": "bg-nota/15",
    "/financas": "bg-financa/15",
  };

  function abrirMenu() {
    vibrar(10);
    setLeque((v) => !v);
  }

  return (
    <>
      <nav
        className={`lg:hidden fixed bottom-0 left-0 right-0 ${leque ? "z-[46]" : "z-20"} bg-base-800/95 backdrop-blur border-t border-base-600`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="relative max-w-2xl mx-auto grid grid-cols-5 items-end">
          {/* Etapa 281 — pílula que desliza até a aba ativa, na cor da área */}
          {itemAtivo && (
            <span
              aria-hidden
              className={`absolute top-1.5 bottom-1.5 left-0 w-[20%] px-2 transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] pointer-events-none`}
              style={{ transform: `translateX(${indiceAtivo * 100}%)` }}
            >
              <span className={`block w-full h-full rounded-2xl transition-colors duration-300 ${COR_PILULA[itemAtivo.href] ?? "bg-ink-100/10"}`} />
            </span>
          )}
          {ITENS.map((item, i) =>
            item === null ? (
              <div key="mais" className="flex justify-center">
                <button
                  type="button"
                  onClick={abrirMenu}
                  aria-label={leque ? "Fechar" : "Adicionar"}
                  aria-expanded={leque}
                  className="relative z-[46] -mt-6 mb-1.5 w-14 h-14 rounded-full bg-gradient-to-br from-habito to-financa text-base-900 flex items-center justify-center shadow-lg shadow-black/40 ring-4 ring-base-900 active:scale-95 transition"
                >
                  <Plus size={28} strokeWidth={2.6} className={`transition-transform duration-300 ${leque ? "rotate-45" : ""}`} />
                </button>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-xs transition ${
                  areaAtiva(pathname, item.href) ? `${item.cor} font-semibold` : "text-ink-400 hover:text-ink-100"
                }`}
              >
                <item.Icone size={22} strokeWidth={areaAtiva(pathname, item.href) ? 2.4 : 2} />
                {item.rotulo}
              </Link>
            )
          )}
        </div>
      </nav>

      {/* Etapa 283 — o "+" abre um cartão no estilo do app (antes eram
         bolhas coloridas, que ficavam cortadas pela barra) */}
      {leque && (
        <div className="lg:hidden fixed inset-0 z-[45] animate-fundo bg-black/60" onClick={() => setLeque(false)}>
          <div
            className="absolute left-4 right-4 mx-auto max-w-md animate-surgir origin-bottom"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 5.5rem)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-base-800 border border-base-600 rounded-3xl p-3 shadow-2xl shadow-black/50">
              <div className="grid grid-cols-4 gap-1">
                {[
                  { rotulo: "Gasto", Icone: TrendingDown, classe: "bg-red-400/15 text-red-400", acao: () => setGasto(true) },
                  { rotulo: "Tarefa", Icone: CheckSquare, classe: "bg-nota/15 text-nota", href: "/tarefas/nova" },
                  { rotulo: "Hábito", Icone: Repeat, classe: "bg-habito/15 text-habito", href: "/habitos/novo" },
                  { rotulo: "Mais", Icone: Plus, classe: "bg-base-700 text-ink-100", acao: () => setMenu(true) },
                ].map((b, n) => {
                  const conteudo = (
                    <>
                      <span className={`w-12 h-12 rounded-2xl ${b.classe} flex items-center justify-center`}>
                        <b.Icone size={22} strokeWidth={2.2} />
                      </span>
                      <span className="text-xs font-medium text-ink-100">{b.rotulo}</span>
                    </>
                  );
                  const classe = "flex flex-col items-center gap-1.5 rounded-2xl py-2 hover:bg-base-700 active:scale-95 transition animate-bolha";
                  const estilo = { animationDelay: `${n * 35}ms` } as React.CSSProperties;
                  return b.href ? (
                    <Link key={b.rotulo} href={b.href} onClick={() => setLeque(false)} className={classe} style={estilo}>
                      {conteudo}
                    </Link>
                  ) : (
                    <button
                      key={b.rotulo}
                      type="button"
                      onClick={() => {
                        vibrar(10);
                        setLeque(false);
                        b.acao?.();
                      }}
                      className={classe}
                      style={estilo}
                    >
                      {conteudo}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-2 pt-2 border-t border-base-600">
                <Link
                  href="/rapido"
                  onClick={() => setLeque(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm text-ink-400 hover:text-ink-100 hover:bg-base-700 transition"
                >
                  <Zap size={15} /> Modo rápido
                </Link>
                <Link
                  href="/calendario"
                  onClick={() => setLeque(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm text-ink-400 hover:text-ink-100 hover:bg-base-700 transition"
                >
                  <CalendarDays size={15} /> Calendário
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {menu && (
        <div className="animate-fundo fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setMenu(false)}>
          <div
            className="animate-folha w-full max-w-md bg-base-800 border-t border-base-600 rounded-t-3xl p-5"
            style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg font-display font-semibold">O que você quer adicionar?</p>
              <button onClick={() => setMenu(false)} aria-label="Fechar" className="text-ink-400 hover:text-ink-100 transition p-1">
                <X size={22} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  setGasto(true);
                }}
                className="col-span-2 flex items-center gap-3 rounded-2xl p-4 bg-red-500/10 border border-red-400/40 text-red-400 active:scale-[0.98] transition"
              >
                <TrendingDown size={24} />
                <span className="text-left">
                  <span className="block text-base font-semibold">Gasto</span>
                  <span className="block text-xs text-ink-400">Rápido, sem sair da tela</span>
                </span>
              </button>
              <Opcao href="/financas/nova?tipo=receita" rotulo="Receita" Icone={TrendingUp} classe="bg-habito/10 border-habito/40 text-habito" fechar={() => setMenu(false)} />
              <Opcao href="/financas/transferir" rotulo="Transferir" Icone={ArrowLeftRight} classe="bg-financa/10 border-financa/40 text-financa" fechar={() => setMenu(false)} />
              <Opcao href="/habitos/novo" rotulo="Hábito" Icone={Repeat} classe="bg-habito/10 border-habito/40 text-habito" fechar={() => setMenu(false)} />
              <Opcao href="/tarefas/nova" rotulo="Tarefa" Icone={CheckSquare} classe="bg-nota/10 border-nota/40 text-nota" fechar={() => setMenu(false)} />
              {/* Etapa 282 */}
              <Opcao href="/rapido" rotulo="Modo rápido" Icone={Zap} classe="bg-base-700 border-base-600 text-ink-100" fechar={() => setMenu(false)} />
              <Opcao href="/calendario" rotulo="Calendário" Icone={CalendarDays} classe="bg-base-700 border-base-600 text-ink-100" fechar={() => setMenu(false)} />
            </div>
          </div>
        </div>
      )}

      {gasto && <FolhaLancamento aoFechar={() => setGasto(false)} />}
      {/* Etapa 233 — avisos da dupla (fez, cutucou, reagiu) com animação */}
      <AvisosDupla />
    </>
  );
}

function Opcao({
  href,
  rotulo,
  Icone,
  classe,
  fechar,
}: {
  href: string;
  rotulo: string;
  Icone: typeof Plus;
  classe: string;
  fechar: () => void;
}) {
  return (
    <Link href={href} onClick={fechar} className={`flex items-center gap-3 rounded-2xl p-4 border active:scale-[0.98] transition ${classe}`}>
      <Icone size={22} />
      <span className="text-base font-semibold">{rotulo}</span>
    </Link>
  );
}
