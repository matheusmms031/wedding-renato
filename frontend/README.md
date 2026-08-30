# Frontend — Renato & Marília

React 19 + Vite 8 + React Router 7, sobre o design system
`renato-marilia-wedding-design`. Veja o [README da raiz](../README.md) para subir
o stack inteiro com Docker.

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint     # oxlint
npm run build
```

## Rotas

| Rota | Página | Acesso |
| --- | --- | --- |
| `/login` | Área dos convidados | público |
| `/` | Home: hero, história, quem somos, propósito, local, presentes, RSVP | exige sessão |
| `/admin` | Painel dos noivos | exige perfil de administrador |

Rotas desconhecidas redirecionam para `/`. `RequireAuth` tem três estados —
enquanto `GET /api/auth/session` não responde ele mostra o `PageLoader`, e não
um redirect; sem isso todo refresh de `/` piscaria a tela de login.

## Estrutura

```
src/
  api/             client.js (wrapper de fetch) + um módulo por área
  content/         story.js — TODO o texto da home fica aqui
  styles/          tokens/ (cópia do design system) + base.css
  components/ds/   primitivas da marca
  components/layout/  SiteNavBar, Footer, PageLoader
  components/home/    Hero, Story, Couple, Purpose, Venue, GiftsSection, RSVPSection
  pages/           Home, Login, Admin
  auth/            AuthProvider, contexto, RequireAuth, RequireAdmin
```

## Como conversa com a API

Tudo passa por `/api/…` na **mesma origem** — em dev via `server.proxy` do Vite
(`vite.config.js`), em produção via nginx. O cookie de sessão é `httpOnly`, então
o JavaScript não o enxerga e **nada de identidade vai para `sessionStorage` ou
`localStorage`**. A fonte de verdade é sempre o backend.

`src/api/client.js` só manda `Content-Type: application/json` quando há corpo: o
Fastify recusa com `400 FST_ERR_CTP_EMPTY_JSON_BODY` uma requisição que se
declara JSON e vem vazia — caso de `POST /auth/logout` e do `DELETE` de presente.

Erros do backend viram `ApiError` com `code`, `status` e `details`. As mensagens
já chegam em português e são exibidas cruas, então **toda mensagem nova no
backend precisa ser escrita em pt-BR**.

## Design system

Os tokens em `src/styles/tokens/` são cópia de
`.claude/skills/renato-marilia-wedding-design/tokens/` (única alteração: o
`@import` das fontes virou `<link>` com `preconnect` no `index.html`). Use as
variáveis — nada de hex ou px cru.

Três famílias com papéis fixos: `Alex Brush` só para os nomes dos noivos e
palavras-herói, `Cormorant Garamond` para texto corrido, `Oswald` para rótulos,
datas e navegação.

> O Cormorant usa algarismos *old-style* por padrão, o que faz "1/10" parecer
> "I/Io". Onde houver dado numérico (tabelas, indicadores, preços), aplique
> `font-variant-numeric: lining-nums tabular-nums`.

Primitivas em `src/components/ds/`: `Button`, `Card`, `DateBlock`, `Input`,
`Monogram`, `ScriptHeading`, `SectionLabel`, `Select`, `Textarea`.

## Mobile e iPad

Três pontos de quebra, cada um com um motivo:

| Largura | O que muda |
| --- | --- |
| `< 900px` | O nav vira menu que abre (`Menu` / `Fechar`), e o hero empilha em uma coluna. Os seis links não cabem numa linha abaixo disso: a barra quebrava em três fileiras e ocupava 140px fixos de uma tela de 667px. |
| `901–1280px` | iPad em paisagem. O hero segue em duas colunas, mas `--text-script-hero` escala pela **viewport** (`9vw`) e não pela coluna de 42% — sem um teto próprio o nome do casal fica espremido. |
| `< 700px` | As tabelas do painel viram cartões empilhados, com o cabeçalho da coluna vindo de `data-label`. A tabela de convidados tem 462px numa área útil de 293px. |

Alvos de toque: `@media (pointer: coarse), (max-width: 900px)` em `ds.css` garante 44px
de altura em todo controle. **As duas condições são necessárias** — `coarse` sozinho
deixa de fora o iPad com Magic Keyboard, que reporta `pointer: fine`.

O `index.html` usa `viewport-fit=cover` e o nav e o rodapé respeitam
`env(safe-area-inset-*)`, para o notch e a barra inferior do iPhone.

## Duas armadilhas de tipografia

O **Cormorant** usa algarismos *old-style*: "1/10" sai como "I/Io". Onde houver
dado numérico, aplique `font-variant-numeric: lining-nums tabular-nums`.

O **Alex Brush** tem dois problemas de centralização, e nenhum deles aparece
medindo caixas — as caixas estão sempre certas.

*Vertical:* a caixa de linha reserva 9px vazios acima da tinta e 17px abaixo
(medido a 56px). Num bloco centralizado o texto parece subido. Resolvido com
`text-box: trim-both cap alphabetic` em `.ds-script`.

*Horizontal:* os floreios transbordam a caixa de avanço de forma assimétrica e
diferente por palavra. "Renato &" tem a tinta 3,2px à esquerda do centro e
"Marília" 5,6px à direita (a 128px). Centralizadas pela caixa, as duas linhas
pendem para lados opostos e o bloco parece torto. Resolvido com um nudge por
linha (`--optico` em `.hero__name-line`), em `em` para escalar com a fonte.

Para medir outra palavra, use o canvas:

```js
const cv = document.createElement('canvas').getContext('2d')
cv.font = "128px 'Alex Brush'"
const m = cv.measureText('Marília')
// desvio da tinta em relação ao centro da caixa de avanço:
;((-m.actualBoundingBoxLeft + m.actualBoundingBoxRight) / 2) - m.width / 2
```

## Textos da home

Toda a prosa das seções **Nossa História**, **Quem Somos** e **Um Só Propósito**
mora em `src/content/story.js` — um arquivo só, sem JSX no meio. É o único lugar
a editar para trocar os textos.

## Pendências

- **Os textos da home são rascunho.** A prosa em `src/content/story.js` foi
  escrita para dar forma e ritmo às seções, mas não é a história de Renato e
  Marília. Os fatos que só eles sabem — profissões, datas, onde se conheceram —
  estão em branco de propósito e aparecem como lacunas na página: melhor um
  espaço vazio do que informação inventada no site do próprio casamento.
- **Retratos individuais.** O hero já usa `src/assets/fotos/casal.jpg`. Os
  perfis de "Quem Somos" aceitam um retrato cada (`renato.jpg`, `marilia.jpg`)
  — veja `src/assets/fotos/LEIA-ME.md`. Sem eles a seção fica só com nome e
  texto, o que também funciona.
- **Presentear não cobra nada.** A escolha do presente é registrada e aparece
  para os noivos no painel; não há integração de pagamento.
