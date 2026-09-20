package com.vidatrack.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.vidatrack.app.widget.WidgetHojePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Etapa 152: plugin próprio (não vem do npm) que avisa o
        // widget de tela inicial quando a contagem de hábitos de
        // hoje muda — precisa ser registrado ANTES do super.onCreate.
        registerPlugin(WidgetHojePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
