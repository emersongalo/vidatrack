import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { atualizarHabito } from "../../actions";
import { FormularioHabito } from "@/components/FormularioHabito";

export default async function EditarHabitoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const [{ data: habito }, { data: categorias }] = await Promise.all([
    supabase
      .from("habitos")
      .select("id, nome, cor, icone, frequencia, dias_semana, categoria_id, horario_lembrete, meta_diaria, unidade")
      .eq("id", params.id)
      .single(),
    supabase.from("categorias_produtividade").select("id, nome").order("nome"),
  ]);

  if (!habito) notFound();

  return (
    <main className="max-w-md mx-auto px-6 md:px-12 pt-2">
      <Link href="/habitos/lista" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Hábitos
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Editar hábito</h1>

      {searchParams.erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(searchParams.erro)}
        </p>
      )}

      <FormularioHabito
        action={atualizarHabito.bind(null, habito.id)}
        categorias={categorias ?? []}
        textoBotao="Salvar alterações"
        valoresIniciais={{
          nome: habito.nome,
          cor: habito.cor,
          icone: habito.icone,
          frequencia: habito.frequencia,
          diasSemana: habito.dias_semana ?? [],
          categoriaId: habito.categoria_id,
          horarioLembrete: habito.horario_lembrete,
          metaDiaria: habito.meta_diaria ?? 1,
          unidade: habito.unidade,
        }}
      />
    </main>
  );
}
