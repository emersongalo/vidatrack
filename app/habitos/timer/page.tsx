import { TimerFoco } from "@/components/TimerFoco";

export default function TimerPage() {
  return (
    <main className="max-w-sm mx-auto px-6 pt-2">
      <h1 className="text-2xl font-display font-semibold mb-8">Timer</h1>
      <TimerFoco />
      <p className="text-xs text-ink-400 text-center mt-8">
        Fica só nesta aba — se sair da tela, a contagem para. Vincular o
        timer a um hábito ou tarefa específica fica para uma próxima etapa.
      </p>
    </main>
  );
}
