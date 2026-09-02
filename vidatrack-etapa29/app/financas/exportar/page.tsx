import Link from "next/link";

export default function ExportarPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Exportar</h1>

      <div className="space-y-3">
        <a
          href="/financas/exportar/csv?periodo=mes"
          className="block bg-base-800 border border-base-600 rounded-lg p-4 hover:border-financa transition"
        >
          <p className="font-medium">Mês atual</p>
          <p className="text-ink-400 text-sm">Só os lançamentos deste mês</p>
        </a>
        <a
          href="/financas/exportar/csv?periodo=tudo"
          className="block bg-base-800 border border-base-600 rounded-lg p-4 hover:border-financa transition"
        >
          <p className="font-medium">Tudo</p>
          <p className="text-ink-400 text-sm">Todo o histórico de lançamentos</p>
        </a>
      </div>

      <p className="text-xs text-ink-400 mt-4">
        Gera um arquivo .csv que abre direto no Excel, Google Sheets ou
        Numbers.
      </p>
    </main>
  );
}
