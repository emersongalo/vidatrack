// Etapa 230 — "carregando" padrão: blocos cinza pulsando no formato do conteúdo
export function Esqueleto({ linhas = 3, comTopo = true }: { linhas?: number; comTopo?: boolean }) {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Carregando">
      {comTopo && <div className="h-36 rounded-3xl bg-base-800" />}
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl bg-base-800 p-4">
          <div className="w-11 h-11 rounded-xl bg-base-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 rounded bg-base-700" style={{ width: `${70 - i * 12}%` }} />
            <div className="h-3 rounded bg-base-700 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
