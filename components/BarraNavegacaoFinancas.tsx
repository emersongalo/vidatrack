"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Landmark, Receipt, MoreHorizontal, Repeat, Tags, Target,
  BarChart3, PiggyBank, Grid3x3, Bot,
} from "lucide-react";
import { BotaoNovoLancamento } from "@/components/BotaoNovoLancamento";
import { BotaoAssistenteFlutuante } from "@/components/BotaoAssistenteFlutuante";
import { BarraInferiorApp } from "@/components/BarraInferiorApp";


// Etapa 160 — só pro menu lateral do desktop: em vez de repetir as
// mesmas 4 abas do celular (deixando um monte de tela boa escondida
// dentro de "Mais"), mostra tudo de cara, em grupos — mesma ideia do
// menu lateral do Despezzas, que serviu de inspiração aqui.
const GRUPOS_DESKTOP = [
  {
    titulo: "Controle",
    itens: [
      { href: "/financas", rotulo: "Início", Icone: Home },
      { href: "/financas/extrato", rotulo: "Extrato", Icone: Receipt },
      { href: "/financas/contas", rotulo: "Contas", Icone: Landmark },
      { href: "/financas/recorrentes", rotulo: "Recorrentes", Icone: Repeat },
    ],
  },
  {
    titulo: "Organização",
    itens: [
      { href: "/financas/categorias", rotulo: "Categorias", Icone: Tags },
      { href: "/financas/metas", rotulo: "Metas", Icone: Target },
      { href: "/financas/investir", rotulo: "Investido", Icone: PiggyBank },
      { href: "/financas/desafios", rotulo: "Desafios", Icone: Grid3x3 },
      { href: "/financas/analise", rotulo: "Análise", Icone: BarChart3 },
      { href: "/financas/assistente", rotulo: "Assistente", Icone: Bot },
    ],
  },
];

function ehAtiva(pathname: string, href: string) {
  return href === "/financas" ? pathname === "/financas" : pathname.startsWith(href);
}

// Lista de links pro menu lateral do desktop — sem wrapper de
// esconder/mostrar aqui, porque quem decide isso é o próprio
// MenuLateralDesktop (que já só aparece no desktop).
export function SubmenuFinancas() {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-4 mt-1">
      {GRUPOS_DESKTOP.map((grupo) => (
        <div key={grupo.titulo}>
          <p className="px-3 mb-1 text-xs uppercase tracking-wide text-ink-400/70">{grupo.titulo}</p>
          <div className="flex flex-col gap-0.5">
            {grupo.itens.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  ehAtiva(pathname, item.href)
                    ? "bg-financa/15 text-financa font-medium"
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
      <Link
        href="/financas/mais"
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
          ehAtiva(pathname, "/financas/mais")
            ? "bg-financa/15 text-financa font-medium"
            : "text-ink-400 hover:text-ink-100 hover:bg-base-700"
        }`}
      >
        <MoreHorizontal size={17} strokeWidth={2} />
        Mais (importar, exportar...)
      </Link>
    </div>
  );
}

// Barra fixa de baixo — só pra celular/tablet (o desktop usa o menu
// lateral, com o SubmenuFinancas acima).
export function BarraNavegacaoFinancas() {
  const pathname = usePathname();

  const naTelaDoAssistente = pathname.startsWith("/financas/assistente");

  return (
    <>
      {/* Etapa 150 — escondidos na própria tela do assistente: os
         botões flutuantes ficavam bem em cima do campo de digitar e
         do botão "Enviar" do chat, brigando visualmente com ele —
         e não faria sentido ter um botão pra abrir o assistente
         dentro do próprio assistente mesmo. */}
      {!naTelaDoAssistente && (
        <>
          <BotaoNovoLancamento />
          <BotaoAssistenteFlutuante />
        </>
      )}

      {/* Etapa 230 — barra única do app no celular */}
      <BarraInferiorApp />
    </>
  );
}
