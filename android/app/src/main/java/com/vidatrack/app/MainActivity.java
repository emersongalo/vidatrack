package com.vidatrack.app;

import android.app.DownloadManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.widget.Toast;

import com.getcapacitor.BridgeActivity;
import com.vidatrack.app.widget.WidgetHojePlugin;

public class MainActivity extends BridgeActivity {

    /**
     * Etapa 197 — widgets e notificações mandam junto a tela que deve abrir
     * (ex: "/habitos"). Sem isso o app abria na última tela aberta.
     */
    public static final String EXTRA_ROTA = "com.vidatrack.app.ROTA";

    private static final String SITE_PADRAO = "https://www.vidatrack.online";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins próprios precisam ser registrados ANTES do super.onCreate.
        // Etapa 190 — login nativo do Google.
        registerPlugin(GoogleIdTokenPlugin.class);
        // Etapa 195 — ponte dos widgets.
        registerPlugin(WidgetHojePlugin.class);
        super.onCreate(savedInstanceState);

        // Etapa 215 — downloads (planilha CSV, backup) dentro do app. A
        // WebView sozinha ignora links de download; aqui eles vão pro
        // gerenciador de downloads do Android, com a sessão (cookies)
        // da pessoa, e o arquivo cai na pasta Downloads.
        WebView webView = bridge != null ? bridge.getWebView() : null;
        if (webView != null) {
            webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) ->
                baixarArquivo(url, userAgent, contentDisposition, mimetype));
        }
    }

    private void baixarArquivo(String url, String userAgent, String contentDisposition, String mimetype) {
        if (url == null || !(url.startsWith("https://") || url.startsWith("http://"))) {
            Toast.makeText(this, "Esse arquivo não pode ser baixado pelo app.", Toast.LENGTH_SHORT).show();
            return;
        }
        String nome = URLUtil.guessFileName(url, contentDisposition, mimetype);
        try {
            DownloadManager.Request pedido = new DownloadManager.Request(Uri.parse(url));
            String cookies = CookieManager.getInstance().getCookie(url);
            if (cookies != null) pedido.addRequestHeader("Cookie", cookies);
            if (userAgent != null) pedido.addRequestHeader("User-Agent", userAgent);
            if (mimetype != null) pedido.setMimeType(mimetype);
            pedido.setTitle(nome);
            pedido.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                pedido.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, nome);
            } else {
                // Android 9 ou menor: pasta do próprio app (não pede permissão de armazenamento)
                pedido.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, nome);
            }
            DownloadManager gerenciador = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            gerenciador.enqueue(pedido);
            Toast.makeText(this, "Baixando " + nome + "…", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Toast.makeText(this, "Não consegui baixar o arquivo.", Toast.LENGTH_LONG).show();
        }
    }

    /**
     * O Capacitor chama isso também na abertura "a frio" (dentro do
     * super.onCreate), então cobre os dois casos: app fechado e app
     * já aberto em segundo plano.
     */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        abrirRota(intent);
    }

    private void abrirRota(Intent intent) {
        if (intent == null || bridge == null) return;
        String rota = intent.getStringExtra(EXTRA_ROTA);
        // só caminhos do próprio site ("/habitos"), nunca URL de fora
        if (rota == null || !rota.startsWith("/") || rota.startsWith("//")) return;
        intent.removeExtra(EXTRA_ROTA); // não reabrir ao girar a tela

        String base = bridge.getServerUrl();
        if (base == null || base.trim().isEmpty()) base = SITE_PADRAO;
        while (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        final String url = base + rota;

        final WebView webView = bridge.getWebView();
        if (webView != null) webView.post(() -> webView.loadUrl(url));
    }
}
