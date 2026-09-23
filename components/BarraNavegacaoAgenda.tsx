"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Repeat, LayoutGrid, Timer, CheckSquare, BarChart3, Clock } from "lucide-react";
import { BotaoNovoAgenda } from "@/components/BotaoNovoAgenda";

// Etapa 137: Tarefas saiu de aba própria (eram 5, ficava apertado no
// celular) — agora vive dentro de "Hábitos", acessível pelo alternador
// no topo da página (AlternadorHabitosTarefas). A rota /habitos/tarefas
// continua existindo normalmente, só não tem mais um ícone fixo aqui.
const ABAS = [
  { href: "/habitos", rotulo: "Hoje", Icone: CalendarCheck },
  { href: "/habitos/lista", rotulo: "Hábitos", Icone: Repeat },
  { href: "/habitos/categorias", rotulo: "Categorias", Icone: LayoutGrid },
  { href: "/habitos/timer", rotulo: "Timer", Icone: Timer },
];

// Etapa 160 — só pro menu lateral do desktop: tem espaço de sobra
// pra mostrar tudo de cara, então Tarefas ganha um link próprio de
// novo aqui (no celular continua só pelo alternador, que faz mais
// sentido numa tela pequena) e Estatísticas/Planejador saem da
// obscuridade.
const GRUPOS_DESKTOP = [
  {
    titulo: "Controle",
    itens: [
      { href: "/habitos", rotulo: "Hoje", Icone: CalendarCheck },
      { href: "/habitos/lista", rotulo: "Hábitos", Icone: Repeat },
      { href: "/habitos/tarefas", rotulo: "Tarefas", Icone: CheckSquare },
      { href: "/habitos/categorias", rotulo: "Categorias", Icone: LayoutGrid },
    ],
  },
  {
    titulo: "Acompanhamento",
    itens: [
      { href: "/habitos/estatisticas", rotulo: "Estatísticas", Icone: BarChart3 },
      { href: "/habitos/planejador", rotulo: "Planejador", Icone: Clock },
      { href: "/habitos/timer", rotulo: "Timer", Icone: Timer },
    ],
  },
];

function ehAtiva(pathname: string, href: string) {
  if (href === "/habitos") return pathname === "/habitos";
  return pathname.startsWith(href);
}

// Só pra barra de baixo (celular): "Hábitos" também acende quando
// está em /habitos/tarefas (mesmo grupo, só trocou de sub-aba pelo
// alternador) — porque lá Tarefas não tem ícone próprio. No desktop
// isso não é necessário, já que Tarefas ganhou link dedicado.
function ehAtivaMobile(pathname: string, href: string) {
  if (href === "/habitos/lista") return pathname.startsWith("/habitos/lista") || pathname.startsWith("/habitos/tarefas");
  return ehAtiva(pathname, href);
}

// Lista de links pro menu lateral do desktop — sem wrapper de
// esconder/mostrar aqui, quem decide isso é o MenuLateralDesktop.
export function SubmenuHabitos() {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-4 mt-1">
      {GRUPOS_DESKTOP.map((grupo) => (
        <div key={grupo.titulo}>
          <p className="px-3 mb-1 text-[11px] uppercase tracking-wide text-ink-400/70">{grupo.titulo}</p>
          <div className="flex flex-col gap-0.5">
            {grupo.itens.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  ehAtiva(pathname, item.href)
                    ? "bg-habito/15 text-habito font-medium"
                    : "text-ink-400 hover:text-ink-100 hover:bg-base-700"
                }`}
              >
                <item.Icone size={17} strokeWidth={2} />
                {item.rotulo}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Barra fixa de baixo — só pra celular/tablet.
export function BarraNavegacaoAgenda() {
  const pathname = usePathname();

  return (
    <>
      <BotaoNovoAgenda />
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-800 border-t border-base-600 z-10">
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {ABAS.map((aba) => (
            <Link
              key={aba.href}
              href={aba.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-xs transition ${
                ehAtivaMobile(pathname, aba.href) ? "text-habito" : "text-ink-400 hover:text-ink-100"
              }`}
            >
              <aba.Icone size={19} strokeWidth={2} />
              {aba.rotulo}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
