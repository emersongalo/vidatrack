"use client";

// Etapa 230 — uma barra de baixo só pro app inteiro (celular/tablet):
// Início · Hábitos · (+) · Finanças · Perfil. O "+" do meio abre uma
// folha com tudo que dá pra criar — gasto (na hora, sem sair da tela),
// receita, transferência, hábito e tarefa. As abas de dentro de cada
// área (Contas, Extrato, Categorias...) ficam no topo (AbasArea).
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Repeat, Wallet, User, Plus, X, TrendingDown, TrendingUp, ArrowLeftRight, CheckSquare } from "lucide-react";
import { FolhaLancamento } from "@/components/BotaoNovoLancamento";
import { vibrar } from "@/components/ItemLinhaAgenda";

const ITENS = [
  { href: "/dashboard", rotulo: "Início", Icone: Home, cor: "text-ink-100" },
  { href: "/habitos", rotulo: "Hábitos", Icone: Repeat, cor: "text-habito" },
  null, // lugar do +
  { href: "/financas", rotulo: "Finanças", Icone: Wallet, cor: "text-financa" },
  { href: "/perfil", rotulo: "Perfil", Icone: User, cor: "text-ink-100" },
] as const;

export function areaAtiva(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BarraInferiorApp() {
  const pathname = usePathname() ?? "";
  const [menu, setMenu] = useState(false);
  const [gasto, setGasto] = useState(false);

  function abrirMenu() {
    vibrar(10);
    setMenu(true);
  }

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-base-800/95 backdrop-blur border-t border-base-600"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-2xl mx-auto grid grid-cols-5 items-end">
          {ITENS.map((item, i) =>
            item === null ? (
              <div key="mais" className="flex justify-center">
                <button
                  type="button"
                  onClick={abrirMenu}
                  aria-label="Adicionar"
                  className="-mt-6 mb-1.5 w-14 h-14 rounded-full bg-gradient-to-br from-habito to-financa text-base-900 flex items-center justify-center shadow-lg shadow-black/40 ring-4 ring-base-900 active:scale-95 transition"
                >
                  <Plus size={28} strokeWidth={2.6} />
                </button>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 pt-2.5 pb-2 text-xs transition ${
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

      {menu && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60" onClick={() => setMenu(false)}>
          <div
            className="animate-subir w-full max-w-md bg-base-800 border-t border-base-600 rounded-t-3xl p-5"
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
              <Opcao href="/habitos/tarefas/nova" rotulo="Tarefa" Icone={CheckSquare} classe="bg-nota/10 border-nota/40 text-nota" fechar={() => setMenu(false)} />
            </div>
          </div>
        </div>
      )}

      {gasto && <FolhaLancamento aoFechar={() => setGasto(false)} />}
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
