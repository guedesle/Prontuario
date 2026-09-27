# Simulação local de UI

A simulação local permite revisar a interface com o motor clínico em operação e dados inteiramente sintéticos.

## Iniciar

```bash
npm run dev:ui-sim
```

Abra no navegador:

- `http://127.0.0.1:3101/demo` — evolução longitudinal, problemas, medicamentos, SOAP e relatório familiar;
- `http://127.0.0.1:3101/visual-dietary` — preview interativo de avaliação alimentar.

O launcher mantém o Next interno em `3100` e expõe um proxy local em `3101`. O proxy injeta somente a identidade sintética de CI exigida pelo perímetro da aplicação e encaminha HTTP e HMR WebSocket.

## Garantias

- nenhum banco local é acessado;
- nenhuma credencial Google, VIDaaS ou Bird ID é necessária;
- `DATABASE_URL` e `TEST_DATABASE_URL` apontam para um banco efêmero fictício;
- o launcher recusa `NODE_ENV=production`;
- não use dados reais de pacientes, screenshots reais ou exportações reais;
- finalize com `Ctrl+C`.

As portas podem ser alteradas com `UI_SIMULATION_NEXT_PORT` e `UI_SIMULATION_PORT`. A captura visual deve ser salva em `output/playwright/`, que é artefato local e não faz parte do PR.
