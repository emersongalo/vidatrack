import Link from "next/link";

// Etapa 215 — mais períodos + backup completo
const PERIODOS = [
  { valor: "mes", titulo: "Mês atual", texto: "Lançamentos deste mês (inclui os agendados)" },
  { valor: "mes_anterior", titulo: "Mês passado", texto: "Pra fechar as contas do mês que acabou" },
  { valor: "ano", titulo: "Este ano", texto: "De janeiro a dezembro — bom pro imposto de renda" },
  { valor: "tudo", titulo: "Tudo", texto: "Todo o histórico de lançamentos" },
];

export default function ExportarPage() {
  return (
    <main className="min-h-screen p-6 md:p-12 pagina-curta">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-1">Exportar</h1>
      <p className="text-ink-400 text-sm mb-6">Planilha (.csv) que abre no Excel, Google Planilhas ou Numbers.</p>

      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {PERIODOS.map((p) => (
          <a
            key={p.valor}
            href={`/financas/exportar/csv?periodo=${p.valor}`}
            className="block bg-base-800 border border-base-600 rounded-lg p-4 hover:border-financa transition"
          >
            <p className="font-medium">{p.titulo}</p>
            <p className="text-ink-400 text-sm">{p.texto}</p>
          </a>
        ))}
      </div>

      <h2 className="text-lg font-display font-semibold mt-10 mb-1">Backup completo</h2>
      <p className="text-ink-400 text-sm mb-3">
        Uma cópia de tudo que é seu no app — hábitos, tarefas, notas, diário, contas, lançamentos, metas — num arquivo
        .json. Guarde num lugar seguro.
      </p>
      <a
        href="/api/backup"
        className="block bg-base-800 border border-base-600 rounded-lg p-4 hover:border-habito transition"
      >
        <p className="font-medium">💾 Baixar backup (.json)</p>
        <p className="text-ink-400 text-sm">Seus dados, do seu jeito (LGPD)</p>
      </a>

      <p className="text-xs text-ink-400 mt-4">
        No app do Android o arquivo vai pra pasta Downloads do celular.
      </p>
    </main>
  );
}
