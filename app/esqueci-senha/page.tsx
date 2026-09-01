import Link from "next/link";
import { pedirRedefinicaoSenha } from "../login/actions";

export default function EsqueciSenhaPage({
  searchParams,
}: {
  searchParams: { erro?: string; enviado?: string };
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-display font-semibold mb-1">
          Redefinir senha
        </h1>
        <p className="text-ink-400 text-sm mb-6">
          Enviaremos um link para você criar uma nova senha.
        </p>

        {searchParams.erro && (
          <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
            {decodeURIComponent(searchParams.erro)}
          </p>
        )}

        {searchParams.enviado === "ok" ? (
          <p className="text-sm text-habito bg-habito-soft border border-habito/30 rounded-lg px-3 py-2">
            Link enviado. Confira sua caixa de entrada (e o spam).
          </p>
        ) : (
          <form action={pedirRedefinicaoSenha} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm text-ink-400 mb-1">
                E-mail da sua conta
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-ink-100 text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition"
            >
              Enviar link de redefinição
            </button>
          </form>
        )}

        <Link href="/login" className="block mt-6 text-sm text-ink-400 hover:text-ink-100 transition">
          ← Voltar para o login
        </Link>
      </div>
    </main>
  );
}
