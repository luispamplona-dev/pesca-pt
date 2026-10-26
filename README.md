# Observatório da Terceira — aplicação web

Interface web responsiva em português, com estética steampunk, para explorar condições atmosféricas, previsão horária e de 7 dias, fase lunar e uma secção de marés.

## Executar
1. Descompacte a pasta num servidor web (Apache, Nginx, GitHub Pages, Netlify, etc.).
2. Sirva `index.html`, `style.css` e `app.js` pelo mesmo diretório. Para testar localmente, execute `python -m http.server 8000` nesta pasta e abra `http://localhost:8000`.
3. A aplicação precisa de ligação à Internet para consultar as APIs externas. A última localização escolhida é guardada no `localStorage` do browser.

## Fontes e limitações
- Meteorologia: [Open-Meteo Forecast API](https://open-meteo.com/en/docs). Fornece previsão e valores de modelo, não necessariamente observações de uma estação local.
- Marés: tenta consultar [Open Waters Tides API](https://openwaters.io/api/tides/). A cobertura e o formato podem variar; a aplicação falha de forma explícita se não conseguir confirmar previsões.
- Fase lunar: estimativa calculada no browser.
- Períodos solunares: aproximação simples, não efemérides astronómicas de precisão.
- Constantes harmónicas: não são inventadas. A secção explica o seu significado e só deve ser preenchida quando estiver integrada uma fonte que devolva constituintes validados para a estação local.

## Antes de produção
A versão é um protótipo funcional de interface. Para uma publicação operacional fiável, validar a API de marés e os seus parâmetros/respostas reais para a Terceira; integrar as constantes harmónicas oficiais do Instituto Hidrográfico ou de uma fonte oceanográfica documentada; substituir a aproximação solunar por cálculo astronómico com efemérides; acrescentar cache no servidor, monitorização de falhas, atribuição/licenciamento de dados e testes de fuso horário. A tendência barométrica nesta versão é estimada a partir de pontos do modelo horário e deve ser identificada como tal, não como leitura de barómetro físico.
