import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { arquivarNota, enviarAnexo, gerarUrlAnexo } from "../actions";
import { EditorNota } from "@/components/EditorNota";
import { ListaAnexos } from "@/components/ListaAnexos";
import { PainelCompartilhamento } from "@/components/PainelCompartilhamento";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";

export default async function NotaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const { data: nota } = await supabase
    .from("notas")
    .select("id, titulo, conteudo, horario_lembrete")
    .eq("id", params.id)
    .single();

  if (!nota) notFound();

  const { data: anexos } = await supabase
    .from("nota_anexos")
    .select("id, nome_arquivo, caminho_storage, tipo, tamanho_bytes")
    .eq("nota_id", params.id)
    .order("criado_em", { ascending: false });

  const anexosComUrl = await Promise.all(
    (anexos ?? []).map(async (anexo) => ({
      ...anexo,
      url: await gerarUrlAnexo(anexo.caminho_storage),
    }))
  );

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/notas" className="text-ink-400 text-sm hover:text-ink-100 transition">
          ← Notas
        </Link>
        <BotaoComConfirmacao
          acao={arquivarNota.bind(null, nota.id)}
          textoBotao="Arquivar"
          classeBotao="text-ink-400 text-sm hover:text-red-400 transition"
        />
      </div>

      {searchParams.erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(searchParams.erro)}
        </p>
      )}

      <EditorNota
        notaId={nota.id}
        tituloInicial={nota.titulo}
        conteudoInicial={nota.conteudo}
        horarioLembreteInicial={nota.horario_lembrete}
      />

      <div className="mt-8 pt-6 border-t border-base-600">
        <p className="text-sm text-ink-400 mb-3">Anexos</p>

        <ListaAnexos notaId={nota.id} anexos={anexosComUrl} />

        <form
          action={enviarAnexo.bind(null, nota.id)}
          className="mt-3 flex items-center gap-3"
        >
          <input
            type="file"
            name="arquivo"
            required
            accept="image/*,application/pdf,text/plain"
            className="text-sm text-ink-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-base-600 file:bg-base-800 file:text-ink-100 file:text-sm hover:file:bg-base-700 file:cursor-pointer cursor-pointer"
          />
          <button
            type="submit"
            className="text-sm border border-base-600 rounded-lg px-3 py-1.5 hover:bg-base-800 transition shrink-0"
          >
            Enviar
          </button>
        </form>
        <p className="text-xs text-ink-400 mt-2">
          Imagens, PDF ou texto — até 10MB.
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-base-600">
        <p className="text-sm text-ink-400 mb-3">Compartilhar</p>
        <PainelCompartilhamento
          tipoItem="nota"
          itemId={nota.id}
          caminhoRetorno={`/notas/${nota.id}`}
        />
      </div>
    </main>
  );
}
