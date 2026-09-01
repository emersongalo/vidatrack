import { definirNovaSenha } from "./actions";

export default function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-display font-semibold mb-1">Nova senha</h1>
        <p className="text-ink-400 text-sm mb-6">
          Escolha uma nova senha para sua conta.
        </p>

        {searchParams.erro && (
          <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
            {decodeURIComponent(searchParams.erro)}
          </p>
        )}

        <form action={definirNovaSenha} className="space-y-3">
          <div>
            <label htmlFor="senha" className="block text-sm text-ink-400 mb-1">
              Nova senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              minLength={6}
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            />
          </div>
          <div>
            <label htmlFor="confirmarSenha" className="block text-sm text-ink-400 mb-1">
              Confirmar nova senha
            </label>
            <input
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              required
              minLength={6}
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-ink-100 text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition"
          >
            Salvar nova senha
          </button>
        </form>
      </div>
    </main>
  );
}
