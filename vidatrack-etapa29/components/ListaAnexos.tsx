"use client";

import { removerAnexo } from "@/app/notas/actions";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";

type Anexo = {
  id: string;
  nome_arquivo: string;
  url: string;
  caminho_storage: string;
  tipo: string | null;
  tamanho_bytes: number | null;
};

function formatarTamanho(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ListaAnexos({ notaId, anexos }: { notaId: string; anexos: Anexo[] }) {
  if (anexos.length === 0) return null;

  return (
    <ul className="space-y-2">
      {anexos.map((anexo) => {
        const ehImagem = anexo.tipo?.startsWith("image/");
        return (
          <li
            key={anexo.id}
            className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg p-3"
          >
            {ehImagem ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={anexo.url}
                alt={anexo.nome_arquivo}
                className="w-10 h-10 rounded object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-base-700 flex items-center justify-center text-ink-400 text-xs shrink-0">
                📄
              </div>
            )}
            <a
              href={anexo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0"
            >
              <p className="text-sm truncate hover:underline">{anexo.nome_arquivo}</p>
              <p className="text-xs text-ink-400">{formatarTamanho(anexo.tamanho_bytes)}</p>
            </a>
            <BotaoComConfirmacao
              acao={() => removerAnexo(notaId, anexo.id, anexo.caminho_storage)}
              textoBotao="✕"
              classeBotao="text-ink-400 hover:text-red-400 transition text-sm px-1"
            />
          </li>
        );
      })}
    </ul>
  );
}
