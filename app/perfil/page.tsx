import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { resolverUrlFoto } from "@/lib/perfil/foto";
import { atualizarPerfil } from "./actions";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: { erro?: string; sucesso?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, foto_url")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const urlFoto = await resolverUrlFoto(perfil?.foto_url ?? null);

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-sm mx-auto">
      <Link href="/dashboard" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Painel
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Seu perfil</h1>

      {searchParams.erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(searchParams.erro)}
        </p>
      )}
      {searchParams.sucesso && (
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
              {(perfil?.nome || user?.email || "?").charAt(0).toUpperCase()}
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
            defaultValue={perfil?.nome ?? ""}
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          />
          <p className="text-xs text-ink-400 mt-1.5">
            Esse é o nome que aparece pra quem você compartilha hábitos, notas
            ou contas.
          </p>
        </div>

        <div>
          <label className="block text-sm text-ink-400 mb-1">E-mail</label>
          <p className="text-sm text-ink-100 bg-base-800 border border-base-600 rounded-lg px-3 py-2.5">
            {user?.email}
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-ink-100 text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition"
        >
          Salvar
        </button>
      </form>

      <div className="mt-10 pt-6 border-t border-base-600">
        <Link href="/perfil/excluir-conta" className="text-xs text-red-400/70 hover:text-red-400 transition">
          Excluir minha conta permanentemente
        </Link>
      </div>
    </main>
  );
}
