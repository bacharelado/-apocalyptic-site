# APOCALYPTIC — Site Institucional

Site institucional da **APOCALYPTIC**, focado em Red Team corporativo ético e autorizado.

**Estado:** primeira versão implementada na branch `feat/site-institucional-v1`; ainda não publicada.

## Páginas
- `index.html` — início.
- `servicos.html` — serviços.
- `metodologia.html` — processo de trabalho.
- `sobre.html` — missão e princípios.
- `contato.html` — contato (canais oficiais ainda pendentes).

## Tecnologia
HTML, CSS e JavaScript sem bibliotecas externas ou compilação. Recursos em `assets/`, CSS em `css/` e JS em `js/`. Cabeçalhos de segurança em `_headers`.

## Visualização local
Abra `index.html` no navegador ou, na pasta do projeto, execute `python -m http.server 8000` e acesse `http://localhost:8000`.

## Pendências antes da publicação
- Validar o visual em computador e celular.
- Aprovar missão, serviços e símbolo A/4.
- Informar os canais comerciais oficiais.
- Verificar acessibilidade, navegação e cabeçalhos no ambiente de prévia.
- Definir domínio; só então adicionar URL canônica e sitemap.

## Segurança
Não salvar segredos, dados de clientes ou relatórios neste repositório. Não há autenticação nem backend nesta fase.

O projeto foi integrado a partir da entrega local do Claude, com pequenos ajustes de CSS/JS para manter conteúdo visível quando o JavaScript estiver indisponível. A integração não preserva o SHA original do commit local do Claude.
