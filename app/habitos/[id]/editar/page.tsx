"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { atualizarHabito } from "../../actions";
import { FormularioHabito } from "@/components/FormularioHabito";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

// Etapa 128: acha o hábito pelo id dentro do retrato já baixado —
// funciona mesmo offline, desde que esse hábito já existisse na
// última vez que o retrato foi atualizado. Salvar a edição continua
// precisando de internet (redireciona pra /habitos/lista ao terminar).
export default function EditarHabitoPage() {
  return (
    <Suspense fallback={null}>
      <EditarHabitoConteudo />
    </Suspense>
  );
}

function EditarHabitoConteudo() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const erro = searchParams.get("erro");
  const { snapshot } = useSnapshotOffline();

  if (snapshot === undefined) {
    return (
      <main className="max-w-md lg:max-w-xl mx-auto px-6 md:px-12 pt-2 animate-pulse">
        <div className="h-64 bg-base-800 border border-base-600 rounded-xl2 mt-6" />
      </main>
    );
  }

  const habito = (snapshot?.habitos ?? []).find((h: any) => h.id === params.id);
  const categorias = snapshot?.categoriasProdutividade ?? [];

  if (!habito) {
    return (
      <main className="max-w-md lg:max-w-xl mx-auto px-6 md:px-12 pt-2">
        <Link href="/habitos/lista" className="text-ink-400 text-sm hover:text-ink-100 transition">
          ← Hábitos
        </Link>
        <p className="text-ink-400 text-sm mt-6">
          Não encontrei esse hábito no que está salvo no aparelho. Se você criou ele há pouco tempo, conecte à
          internet uma vez pra atualizar.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-md lg:max-w-xl mx-auto px-6 md:px-12 pt-2">
      <Link href="/habitos/lista" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Hábitos
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Editar hábito</h1>

      {erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(erro)}
        </p>
      )}

      <FormularioHabito
        action={atualizarHabito.bind(null, habito.id)}
        categorias={categorias as any}
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
          ehNegativo: habito.eh_negativo,
        }}
      />
    </main>
  );
}
