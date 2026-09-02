import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/habitos/streak";
import { TiraDeDiasAgenda } from "@/components/TiraDeDiasAgenda";
import { GradeDia } from "@/components/GradeDia";

export default async function PlanejadorPage({
  searchParams,
}: {
  searchParams: { data?: string };
}) {
  const supabase = createClient();
  const hoje = hojeISO();
  const dataSelecionada = searchParams.data ?? hoje;

  const { data: blocos } = await supabase
    .from("blocos_tempo")
    .select("id, titulo, hora_inicio, hora_fim, cor")
    .eq("data", dataSelecionada)
    .order("hora_inicio");

  return (
    <main className="max-w-2xl mx-auto px-6 md:px-12 pt-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href="/habitos" className="text-ink-400 text-sm hover:text-ink-100 transition">
            ← Hoje
          </Link>
          <h1 className="text-2xl font-display font-semibold mt-2">Planejador</h1>
        </div>
      </div>

      <TiraDeDiasAgenda dataSelecionada={dataSelecionada} hojeISO={hoje} caminhoBase="/habitos/planejador" />

      <p className="text-xs text-ink-400 my-4">
        Arraste na grade pra criar um bloco. Arraste um bloco existente pra mover, ou puxe a base pra redimensionar.
        Clique duas vezes no título pra renomear.
      </p>

      <GradeDia blocos={blocos ?? []} dataISO={dataSelecionada} ehHoje={dataSelecionada === hoje} />
    </main>
  );
}
