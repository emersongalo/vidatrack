const CORES_PREENCHIDO: Record<string, string> = {
  habito: "bg-habito",
  nota: "bg-nota",
  financa: "bg-financa",
};

export function TiraHistorico({
  dias,
  cor,
}: {
  dias: { data: string; feito: boolean }[];
  cor: string;
}) {
  return (
    <div className="flex gap-1">
      {dias.map((dia) => (
        <div
          key={dia.data}
          title={dia.data}
          className={`w-2.5 h-6 rounded-sm ${
            dia.feito ? CORES_PREENCHIDO[cor] ?? CORES_PREENCHIDO.habito : "bg-base-600"
          }`}
        />
      ))}
    </div>
  );
}
