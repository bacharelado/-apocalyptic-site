# Publicação e revisão — APOCALYPTIC

## Estado e branches

| Finalidade | Branch |
| --- | --- |
| Produção informada pelo fundador e pela PR AP-003 | `feat/site-institucional-v1` |
| Correção de contatos, PR #2 | `fix/ap-003-contatos-comerciais` |
| Evolução corporativa, AP-004 | `feat/ap-004-evolucao-corporativa` |
| Branch padrão do repositório; não assumir que publica o site | `main` |

A associação de produção acima vem do contexto fornecido pelo fundador e do aviso na PR #2. A configuração privada da Cloudflare não foi alterada por esta missão.

A AP-004 parte da AP-003 e sua PR aponta para a branch de contatos. Isso permite revisar a evolução sem mover uma branch associada à produção.

**Não fazer merge, habilitar auto-merge ou publicar em produção sem aprovação explícita do fundador.** Alterar uma branch ligada à produção pode disparar uma publicação automática.

## Prévia de desenvolvimento

O projeto é estático e a configuração existente de build não foi modificada. Uma integração Git já existente pode criar uma prévia para a branch de desenvolvimento. Uma prévia de branch não é a publicação da versão no domínio principal.

- Verificar o commit exibido na prévia antes de usá-la como evidência.
- Revisar a home, o catálogo, os contatos e o menu com zoom.
- Conferir 404, sitemap e cabeçalhos no ambiente de prévia.
- Não trocar a branch de produção para obter um link de revisão.

## Revisão autorizada e produção

A abertura de PR e as verificações de desenvolvimento estão autorizadas para a AP-004. Merge, configuração e publicação em produção não estão autorizados.

Uma futura publicação deve ser uma decisão explícita do fundador, com revisão dos contatos e dos riscos pendentes. Como a AP-004 está sobre a AP-003, a estratégia de integração também deve ser revisada antes de qualquer merge.

`_headers` e os SVGs da base foram preservados. O servidor `tools/preview.mjs` é apenas local e não é um backend de produção.
