import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Etapa 218 — mensagens do "Fale conosco", só pra quem administra o app
const ADMINS = (process.env.ADMIN_EMAILS ?? "emerprojetos@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function exigirAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMINS.includes((user.email ?? "").toLowerCase())) redirect("/dashboard");
}

async function marcarRespondida(formData: FormData) {
  "use server";
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const admin = criarClienteAdmin("suporte_marcar", "Marcar mensagem do Fale conosco como respondida");
  await admin.from("mensagens_suporte").update({ respondida: true }).eq("id", id);
  revalidatePath("/admin/mensagens");
}

export default async function MensagensPage({ searchParams }: { searchParams: { todas?: string } }) {
  await exigirAdmin();
  const todas = searchParams.todas === "1";
  const admin = criarClienteAdmin("suporte_listar", "Tela /admin/mensagens: ler mensagens do Fale conosco");
  let consulta = admin
    .from("mensagens_suporte")
    .select("id, usuario_id, assunto, texto, pagina, respondida, criado_em")
    .order("criado_em", { ascending: false })
    .limit(200);
  if (!todas) consulta = consulta.eq("respondida", false);
  const { data: mensagens } = await consulta;

  // e-mail de quem mandou (pra poder responder)
  const emails = new Map<string, string>();
  for (const id of Array.from(new Set((mensagens ?? []).map((m) => m.usuario_id).filter(Boolean))) as string[]) {
    const { data } = await admin.auth.admin.getUserById(id);
    if (data?.user?.email) emails.set(id, data.user.email);
  }

  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <Link href="/dashboard" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Painel
      </Link>
      <div className="flex items-center justify-between mt-4 mb-6">
        <h1 className="text-3xl font-display font-bold">Fale conosco</h1>
        <Link href={todas ? "/admin/mensagens" : "/admin/mensagens?todas=1"} className="text-sm text-ink-400 underline">
          {todas ? "Só não respondidas" : "Ver todas"}
        </Link>
      </div>
      {!mensagens?.length ? (
        <p className="text-ink-400 text-sm">Nenhuma mensagem {todas ? "" : "pendente"}.</p>
      ) : (
        <ul className="space-y-3">
          {mensagens.map((m) => (
            <li key={m.id} className={`bg-base-800 border rounded-xl2 p-4 ${m.respondida ? "border-base-600 opacity-60" : "border-financa/40"}`}>
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="text-sm font-medium">{m.assunto}</span>
                <span className="text-xs text-ink-400">{new Date(m.criado_em as string).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap break-words">{m.texto}</p>
              <p className="text-xs text-ink-400 mt-2 break-all">
                {m.usuario_id ? emails.get(m.usuario_id as string) ?? "usuário" : "sem conta"} · {m.pagina}
              </p>
              {!m.respondida && (
                <form action={marcarRespondida} className="mt-2">
                  <input type="hidden" name="id" value={m.id as string} />
                  <button className="text-xs border border-base-600 rounded-lg px-3 py-1.5">Marcar como respondida</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
