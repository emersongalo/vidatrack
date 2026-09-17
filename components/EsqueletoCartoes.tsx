/**
 * Skeleton genérico usado pelos `loading.tsx` de Hábitos e Finanças.
 * O Next.js mostra isso automaticamente, via Suspense, no instante em
 * que a navegação começa — antes mesmo da página de destino ter
 * buscado qualquer dado. É o que faz a troca de aba parecer instantânea
 * mesmo quando a consulta ao Supabase ainda está em andamento por
 * baixo dos panos.
 */
export function EsqueletoCartoes({
  linhas = 4,
  comResumo = true,
}: {
  linhas?: number;
  comResumo?: boolean;
}) {
  return (
    <main className="max-w-2xl lg:max-w-5xl mx-auto px-6 md:px-12 pt-4 pb-24 animate-pulse">
      <div className="h-7 w-40 bg-base-800 rounded-lg mb-6" />

      {comResumo && (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-5 mb-6">
          <div className="h-4 w-24 bg-base-600 rounded mb-3" />
          <div className="h-8 w-36 bg-base-600 rounded mb-5" />
          <div className="flex gap-6">
            <div className="h-4 w-20 bg-base-600 rounded" />
            <div className="h-4 w-20 bg-base-600 rounded" />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: linhas }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-xl2 p-4"
          >
            <div className="w-9 h-9 rounded-lg bg-base-600 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/2 bg-base-600 rounded" />
              <div className="h-3 w-1/3 bg-base-600 rounded" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
