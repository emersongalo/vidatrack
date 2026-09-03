import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let appFirebase: App | null = null;

function obterAppFirebase(): App | null {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) return null;
  if (getApps().length > 0) {
    appFirebase = getApps()[0];
    return appFirebase;
  }

  try {
    const chaveServico = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8")
    );
    appFirebase = initializeApp({ credential: cert(chaveServico) });
    return appFirebase;
  } catch (erro) {
    console.error("Não consegui inicializar o Firebase Admin (chave de serviço inválida?):", erro);
    return null;
  }
}

/**
 * Manda uma notificação nativa pra um token FCM específico.
 * Retorna `{ tokenInvalido: true }` quando o token não existe mais
 * (app desinstalado, por exemplo) — quem chama usa isso pra limpar a
 * tabela `fcm_tokens`, evitando tentar mandar pro mesmo token morto
 * pra sempre.
 */
export async function enviarNotificacaoFCM(
  token: string,
  titulo: string,
  corpo: string,
  url?: string
): Promise<{ sucesso: boolean; tokenInvalido?: boolean }> {
  const app = obterAppFirebase();
  if (!app) return { sucesso: false };

  try {
    await getMessaging(app).send({
      token,
      notification: { title: titulo, body: corpo },
      data: url ? { url } : {},
      android: { priority: "high" },
    });
    return { sucesso: true };
  } catch (erro: any) {
    const codigo = erro?.errorInfo?.code ?? "";
    const tokenInvalido =
      codigo === "messaging/registration-token-not-registered" ||
      codigo === "messaging/invalid-registration-token";
    if (!tokenInvalido) {
      console.error("Erro ao enviar notificação FCM:", erro);
    }
    return { sucesso: false, tokenInvalido };
  }
}
