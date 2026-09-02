export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-3xl mb-3">📡</p>
        <h1 className="text-xl font-display font-semibold mb-2">Sem conexão</h1>
        <p className="text-ink-400 text-sm max-w-xs mx-auto">
          Essa tela ainda não tinha sido aberta antes, então não dá pra
          mostrar nada sem internet. Abra pelo menos uma vez com conexão
          e ela ficará disponível offline nas próximas vezes.
        </p>
      </div>
    </main>
  );
}
