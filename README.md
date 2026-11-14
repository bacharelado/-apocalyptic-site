# APOCALYPTIC — Site institucional

Site estático em HTML, CSS e JavaScript, com identidade Crimson Defense e catálogo inicial conservador de **Avaliação Ofensiva Externa**.

A contratação depende de análise de viabilidade, escopo e autorização formal. O site não contém formulário, autenticação ou backend de aplicação.

## Estado desta entrega

- AP-004 em desenvolvimento: `feat/ap-004-evolucao-corporativa`.
- Base preservada da AP-003: `fix/ap-003-contatos-comerciais`, commit `cd64d097133fcb84b73ff17feaf0c4f23dceb3be`.
- Produção informada pelo fundador e pela PR AP-003: `feat/site-institucional-v1`.
- A PR AP-004 deve apontar para a branch da AP-003, para revisão separada. Não fazer merge sem aprovação explícita do fundador.
- Esta entrega não altera a configuração da Cloudflare nem autoriza publicação em produção.

Consulte [o relatório AP-004](docs/AP-004-RELATORIO.md) e [o fluxo de publicação](docs/DEPLOY.md).

## Desenvolvimento local

Pré-requisito: Node.js 22 ou superior.

```sh
npm ci --ignore-scripts
npm run dev
```

Acesse `http://127.0.0.1:4174`. O servidor local reproduz as rotas HTML sem extensão, redirecionamentos e o status 404. Ele aplica os cabeçalhos de `_headers` para a verificação local e adiciona `noindex` somente à prévia local.

Os arquivos do site não precisam de compilação. As dependências do npm são ferramentas de verificação e não são carregadas pelos visitantes.

## Verificações

```sh
npm run check
npm run test:static
npx playwright install chromium
npm run test:browser
```

`npm test` executa todas as verificações. Para usar um Chromium já instalado, informe seu caminho em `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Os testes cobrem contatos, estrutura HTML, links, contraste calculado, reflow, navegação por teclado, movimento reduzido, funcionamento sem JavaScript, FAQ, cabeçalhos e regras automatizadas do axe para WCAG 2.2 AA.

Uma execução automática não certifica conformidade integral com WCAG. Validação humana com tecnologias assistivas e dispositivos reais continua necessária. Os resultados efetivamente obtidos estão no relatório da missão; a suíte de navegador deve ser executada em um ambiente que permita iniciar o Chromium.

O workflow `Qualidade do site` foi preparado para verificações em PRs; ele não contém etapas de publicação.

## Páginas

- `/`: início, mensagem principal aprovada, atuação, metodologia e contato.
- `/servicos`: Avaliação Ofensiva Externa e condições de contratação.
- `/metodologia`: contexto, escopo, avaliação e comunicação.
- `/sobre`: propósito, compromissos, missão e visão.
- `/contato`: WhatsApp e e-mail da AP-003.
- `404.html`: resposta para endereços inexistentes.

## Conteúdo e identidade

- Preto `#0B0D12`, carmesim `#991B2B`, prata `#D9DEE7` e branco `#FFFFFF`.
- Tons claros de apoio para contraste de textos pequenos e foco.
- SVG A/4 e favicon originais preservados.
- Sem clientes, certificações, estatísticas ou capacidades operacionais não comprovadas.

Nunca adicione credenciais, dados de clientes ou evidências confidenciais a este repositório.
