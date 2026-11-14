# Relatório AP-004 — evolução corporativa

Data: 14/11/2026, horário de Manaus.

## Base e autorização

Implementação em desenvolvimento autorizada pelo fundador. Publicação em produção não autorizada.

A branch `feat/ap-004-evolucao-corporativa` parte de `fix/ap-003-contatos-comerciais` no commit `cd64d097133fcb84b73ff17feaf0c4f23dceb3be`. A base da AP-003 está um commit à frente de `feat/site-institucional-v1`.

A PR AP-004 aponta para a branch de contatos. `main`, `feat/site-institucional-v1` e a branch da AP-003 não receberam commits desta implementação.

O relatório AP-002 foi recuperado e consultado. Seus achados de contato, contraste, menu curto, semântica, rotas e documentação orientaram a implementação.

## Implementação

| Requisito | Entrega |
| --- | --- |
| AP-003 | Destinatários, mensagem de WhatsApp, assunto de e-mail e proteção da nova aba preservados. |
| AP-004.1 | Identidade Crimson Defense, estilo Corporativo Premium, SVGs A/4 originais e fontes de sistema. |
| AP-004.2 | Mensagem principal aprovada; atuação, metodologia e contato; texto primeiro no layout mobile. |
| AP-004.3 | Catálogo conservador de Avaliação Ofensiva Externa, condicionado à viabilidade, ao escopo e à autorização. |
| AP-004.4 | Menu com rolagem própria e teclado, foco visível, contraste, movimento reduzido, conteúdo sem dependência de JavaScript. |
| AP-002 | Página 404, sitemap XML, metadados, títulos sem saltos e documentação do fluxo real de revisão. |

Não foram criados clientes, depoimentos, certificações, estatísticas ou capacidades operacionais não comprovadas. As entregas do serviço são apresentadas como condições a definir em proposta.

## Arquivos

- `index.html`, `servicos.html`, `metodologia.html`, `sobre.html`, `contato.html`: conteúdo e estrutura corporativos.
- `css/styles.css`: sistema visual, responsividade, foco e tratamento do menu.
- `js/main.js`: melhoria progressiva da navegação, Escape e sincronização por breakpoint.
- `404.html`, `sitemap.xml`, `robots.txt`: rotas ausentes e descoberta.
- `tools/preview.mjs`: servidor local, rotas e cabeçalhos para desenvolvimento.
- `tests/static.test.mjs`, `tests/site.test.mjs`: verificações estáticas/HTTP e suíte de navegador.
- `package.json`, `package-lock.json`: ferramentas somente de desenvolvimento.
- `.github/workflows/quality.yml`: verificações de PR sem publicação.
- `README.md`, `docs/DEPLOY.md`, `docs/ESCOPO.md`, este relatório: estado, escopo e limites.

`assets/logo.svg`, `assets/favicon.svg` e `_headers` permanecem iguais à base.

## Resultados obtidos até a preparação da PR

| Verificação | Resultado |
| --- | --- |
| `npm run check` | Aprovado: sintaxe do JavaScript. |
| `npm run test:static` | 11 testes aprovados, 0 falhas. |
| SVGs e favicon | Hash de blob original preservado: `790e86c51cdd37d5cc6890511c17ab28475e96b0`. |
| Links e recursos locais | Destinos internos responderam corretamente no servidor de desenvolvimento. |
| Contraste calculado | Combinações de texto do tema atingiram pelo menos 4,5:1; foco e borda de controle testados a partir de 3:1. |
| 404 e sitemap | 404 real e XML com cinco endereços confirmados no servidor local. |
| Cabeçalhos | CSP, `nosniff` e `DENY` preservados e servidos na prévia local. |
| Suíte Playwright local | Não iniciou o navegador: Chromium encerrou ao tentar criar um socket interno bloqueado pelo ambiente. Não há resultado funcional ou axe aprovado dessa execução. |
| Acesso do navegador compartilhado ao localhost | Conexão recusada. O navegador e o servidor de execução não compartilharam o acesso por loopback. |
| CI inicial | 36 testes executados: 32 aprovados e 4 falhas de reflow ligadas ao mesmo transbordamento da home. Correção preparada e nova execução pendente. |
| Prévia da PR | `https://cf353035.apocalyptic.pages.dev/`, commit `013367632c3e3ee631c02fff1d56b0c7176080fd`, confirmada pela integração. Revisão visual de desktop realizada. |
| Teclado com zoom de 400% | Cinco links do menu alcançados por Tab dentro da área visível; Escape fechou o painel e restaurou o foco ao botão. Teste no Chrome compartilhado em 340 × 234 CSS px. |

A suíte preparada cobre seis páginas, larguras de 320, 390, 768 e 1366 px, a regressão de 340 × 234 px, teclado, foco, Escape, menu aberto, JavaScript desativado, movimento reduzido, FAQ e regras automáticas do axe para WCAG 2.2 AA.

## Riscos e validações pendentes

- Confirmar com o fundador que o número informado recebe mensagens no WhatsApp. O número de oito dígitos foi preservado sem adaptação por suposição.
- Confirmar abertura do aplicativo de e-mail e recebimento no dispositivo do responsável.
- Executar ou obter o resultado real da suíte de navegador em ambiente que permita iniciar Chromium.
- Validar com leitores de tela, aparelhos reais e navegadores adicionais antes de afirmar conformidade integral com WCAG.
- Confirmar o comportamento de 404, sitemap e cabeçalhos na prévia da hospedagem; o servidor local não certifica a configuração privada do provedor.
- Revisar o texto e a viabilidade real do serviço com o fundador.
- Revisar a integração da AP-003 e da AP-004 antes de qualquer aprovação de produção.

## Segurança e publicação

Sem backend, formulário ou dependência de terceiros carregada no site. Não foi flexibilizada a CSP. Não houve testes ofensivos, merge ou alteração de configuração de produção.

A implementação é uma proposta em desenvolvimento para revisão. O fundador mantém a decisão sobre publicação.
