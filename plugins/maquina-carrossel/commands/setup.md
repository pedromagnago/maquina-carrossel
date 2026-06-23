---
description: Instala as dependências do plugin (Node + Chromium do render + fontes). Rode uma vez após instalar o plugin.
---

Prepare o plugin Máquina de Carrossel para uso. Execute o setup e reporte o resultado de forma curta.

1. Verifique se há Node 18+: `node --version`. Se não houver, avise o usuário para instalar o Node (https://nodejs.org) e pare.
2. Rode o script de setup (instala Playwright + culori + fontes, baixa o Chromium ~150MB uma vez, e cria `~/.maquina-carrossel/`):

   ```bash
   bash "${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh"
   ```

3. Se terminar com sucesso, confirme em 1–2 linhas e diga os próximos passos:
   - cadastrar a marca: `/maquina-carrossel:marca`
   - gerar um carrossel: `/maquina-carrossel:carrossel <tema, link ou texto>`
4. Se falhar, mostre o erro relevante e a causa provável (Node ausente, sem internet para baixar o Chromium, ou permissão de escrita em `~/.maquina-carrossel/`).

Observação: o download do Chromium acontece uma única vez; execuções seguintes são rápidas.
