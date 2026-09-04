import Link from "next/link";
import { LinkVoltar } from "@/components/LinkVoltar";

const ITENS = [
  { href: "/financas/categorias", icone: "🏷️", titulo: "Categorias", texto: "Organize receitas e despesas por tipo" },
  { href: "/financas/recorrentes", icone: "🔁", titulo: "Recorrentes", texto: "Contas e receitas que se repetem todo mês" },
  { href: "/financas/analise", icone: "📊", titulo: "Análise", texto: "Mapa de gastos e comparação com o mês passado" },
  { href: "/financas/personalizar", icone: "↕️", titulo: "Personalizar ordem", texto: "Reorganize os blocos da tela inicial" },
  { href: "/financas/exportar", icone: "⬇️", titulo: "Exportar CSV", texto: "Baixe seus lançamentos em planilha" },
  { href: "/financas/contas/lixeira", icone: "🗑️", titulo: "Lixeira de contas", texto: "Contas arquivadas — restaure ou exclua de vez" },
];

export default function MaisFinancasPage() {
  return (
    <main className="min-h-screen p-6 pb-24 max-w-2xl mx-auto">
      <LinkVoltar href="/financas" texto="Finanças" />
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Mais</h1>

      <ul className="space-y-2">
        {ITENS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-xl2 p-4 hover:border-financa transition"
            >
              <span className="text-xl shrink-0">{item.icone}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{item.titulo}</p>
                <p className="text-xs text-ink-400 mt-0.5">{item.texto}</p>
              </div>
              <span className="text-ink-400 shrink-0">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
