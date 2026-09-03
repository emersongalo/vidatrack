import Link from "next/link";

export default function ContaExcluidaPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-3xl mb-3">👋</p>
        <h1 className="text-xl font-display font-semibold mb-2">Conta excluída</h1>
        <p className="text-ink-400 text-sm max-w-xs mx-auto mb-6">
          Sua conta e todos os seus dados foram apagados permanentemente.
          Obrigado por ter usado o VidaTrack.
        </p>
        <Link
          href="/login"
          className="text-sm text-ink-100 border border-base-600 rounded-lg px-4 py-2 hover:bg-base-800 transition"
        >
          Voltar ao login
        </Link>
      </div>
    </main>
  );
}
