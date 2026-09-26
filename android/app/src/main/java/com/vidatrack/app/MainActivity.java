package com.vidatrack.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Etapa 190 — plugin próprio de login nativo do Google (precisa
        // ser registrado ANTES do super.onCreate).
        registerPlugin(GoogleIdTokenPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
