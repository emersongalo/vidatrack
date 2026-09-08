import { MAPA_ICONES_HABITO } from "@/lib/agenda/icones-habito";

export function IconeHabito({
  icone,
  tamanho = 18,
  className,
}: {
  icone: string | null | undefined;
  tamanho?: number;
  className?: string;
}) {
  const Icone = icone ? MAPA_ICONES_HABITO.get(icone) : undefined;

  if (Icone) {
    return <Icone size={tamanho} strokeWidth={2} className={className} />;
  }

  // Hábito/tarefa criado antes desta etapa ainda guarda um emoji —
  // continua mostrando ele normalmente, sem quebrar nada.
  return <span className={className}>{icone}</span>;
}
