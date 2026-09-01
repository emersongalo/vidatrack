import webpush from "web-push";

let configurado = false;

function garantirConfigurado() {
  if (configurado) return;
  webpush.setVapidDetails(
    "mailto:contato@vidatrack.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configurado = true;
}

export async function enviarPush(
  inscricao: { endpoint: string; chaves: { p256dh: string; auth: string } },
  payload: { titulo: string; corpo: string; url?: string }
) {
  garantirConfigurado();

  await webpush.sendNotification(
    {
      endpoint: inscricao.endpoint,
      keys: inscricao.chaves,
    },
    JSON.stringify(payload)
  );
}
