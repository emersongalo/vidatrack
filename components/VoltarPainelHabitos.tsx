"use client";

// Etapa 227 — o "← Painel" do topo só aparece nas abas principais de
// Hábitos; nas telas com topo colorido (novo, editar, detalhe) ele
// ficava em cima da faixa colorida.
import { usePathname } from "next/navigation";
import { LinkVoltar } from "@/components/LinkVoltar";

const ABAS = ["/habitos", "/habitos/lista", "/habitos/categorias", "/habitos/timer", "/habitos/tarefas"];

export function VoltarPainelHabitos() {
  const caminho = usePathname();
  if (!ABAS.includes(caminho ?? "")) return null;
  return (
    <div className="lg:hidden max-w-2xl mx-auto px-6 md:px-12 pt-4">
      <LinkVoltar href="/dashboard" texto="Painel" />
    </div>
  );
}
