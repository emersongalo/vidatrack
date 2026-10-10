"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/**
 * Etapa 181 — anima cada troca de tela. A `key` mudando a cada rota
 * força o React a remontar esse div, o que reinicia a animação CSS.
 *
 * Etapa 278 — agora com direção, como app nativo: entrar numa tela
 * mais "funda" (ex: Tarefas → uma tarefa) desliza da direita; voltar
 * desliza da esquerda; trocar de área (Início, Hábitos, Tarefas,
 * Finanças) só faz um fade suave.
 */
const AREAS = ["/dashboard", "/habitos", "/tarefas", "/financas"];
let anterior: string | null = null;

function profundidade(p: string) {
  return p.split("/").filter(Boolean).length;
}

export function direcao(de: string | null, para: string): "fade" | "avancar" | "voltar" {
  if (!de || de === para) return "fade";
  if (AREAS.includes(de) && AREAS.includes(para)) return "fade";
  const a = profundidade(de);
  const b = profundidade(para);
  if (b > a) return "avancar";
  if (b < a) return "voltar";
  return "fade";
}

export function TransicaoPagina({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const tipo = direcao(anterior, pathname);
  useEffect(() => {
    anterior = pathname;
  }, [pathname]);
  return (
    <div key={pathname} className={tipo === "avancar" ? "entrada-avancar" : tipo === "voltar" ? "entrada-voltar" : "entrada-tela"}>
      {children}
    </div>
  );
}
