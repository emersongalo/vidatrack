package com.vidatrack.app;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;

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
