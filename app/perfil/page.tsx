"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { atualizarPerfil } from "./actions";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { IconeInstagram } from "@/components/IconeInstagram";
import { useFotoPerfilCache } from "@/lib/perfil/useFotoCache";

// Etapa 134
export default function PerfilPage() {
  return (
    <Suspense fallback={null}>
      <PerfilConteudo />
    </Suspense>
  );
}

function PerfilConteudo() {
  const searchParams = useSearchParams();
  const { snapshot } = useSnapshotOffline();
  const urlFoto = useFotoPerfilCache();

  const nome = snapshot?.perfil.nome ?? "";
  const email = snapshot?.perfil.email ?? "";
  const erro = searchParams.get("erro");
  const sucesso = searchParams.get("sucesso");

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-sm mx-auto">
      <Link href="/dashboard" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Painel
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Seu perfil</h1>

      {erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(erro)}
        </p>
      )}
      {sucesso && (
        <p className="mb-4 text-sm text-habito bg-habito-soft border border-habito/30 rounded-lg px-3 py-2">
          Perfil atualizado!
        </p>
      )}

      <form action={atualizarPerfil} className="space-y-5">
        <div className="flex flex-col items-center gap-3">
          {urlFoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urlFoto}
              alt=""
              width={88}
              height={88}
              className="rounded-full object-cover w-[88px] h-[88px] border border-base-600"
            />
          ) : (
            <div className="w-[88px] h-[88px] rounded-full bg-base-800 border border-base-600 flex items-center justify-center text-2xl text-ink-400">
              {(nome || email || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <label className="text-xs text-financa cursor-pointer hover:underline">
            Trocar foto
            <input type="file" name="foto" accept="image/png,image/jpeg,image/webp" className="hidden" />
          </label>
        </div>

        <div>
          <label htmlFor="nome" className="block text-sm text-ink-400 mb-1">
            Nome
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            defaultValue={nome}
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          />
          <p className="text-xs text-ink-400 mt-1.5">Esse é o nome que aparece pra quem você compartilha hábitos ou contas.</p>
        </div>

        <div>
          <label className="block text-sm text-ink-400 mb-1">E-mail</label>
          <p className="text-sm text-ink-100 bg-base-800 border border-base-600 rounded-lg px-3 py-2.5">{email}</p>
        </div>

        <button type="submit" className="w-full bg-ink-100 text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition">
          Salvar
        </button>
      </form>

      <div className="flex flex-col items-center gap-3 mt-10 pt-6 border-t border-base-600">
        <a
          href="https://instagram.com/vidatrack_"
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-11 rounded-full border border-base-600 flex items-center justify-center text-ink-400 hover:text-financa hover:border-financa transition"
          aria-label="VidaTrack no Instagram"
        >
          <IconeInstagram size={20} />
        </a>
        <p className="text-xs text-ink-400">@vidatrack_ no Instagram</p>
      </div>

      <div className="mt-6 pt-6 border-t border-base-600 text-center">
        <Link href="/perfil/excluir-conta" className="text-xs text-red-400/70 hover:text-red-400 transition">
          Excluir minha conta permanentemente
        </Link>
      </div>
    </main>
  );
}
