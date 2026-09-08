import { TimerFoco } from "@/components/TimerFoco";

export default function TimerPage() {
  return (
    <main className="max-w-sm lg:max-w-md mx-auto px-6 pt-2 lg:pt-16">
      <h1 className="text-2xl lg:text-3xl font-display font-semibold mb-8 text-center lg:text-left">Timer</h1>
      <TimerFoco />
      <p className="text-xs text-ink-400 text-center mt-8">
        Fica só nesta aba — se sair da tela, a contagem para. Vincular o
        timer a um hábito ou tarefa específica fica para uma próxima etapa.
      </p>
    </main>
  );
}
