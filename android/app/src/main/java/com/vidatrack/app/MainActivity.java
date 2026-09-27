package com.vidatrack.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.vidatrack.app.widget.WidgetHojePlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins próprios precisam ser registrados ANTES do super.onCreate.
        // Etapa 190 — login nativo do Google.
        registerPlugin(GoogleIdTokenPlugin.class);
        // Etapa 195 — ponte dos widgets. Tinha sumido daqui na Etapa 190
        // (por isso os widgets pararam de receber dados).
        registerPlugin(WidgetHojePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
