# Site do casamento — Renato & Marília

20 de dezembro de 2026 · Condomínio Mirante do Lago, Palmas TO.

Área dos convidados com login, confirmação de presença (RSVP), lista de presentes
e painel de administração para os noivos.

- **frontend** — React 19 + Vite, sobre o design system `renato-marilia-wedding-design`.
- **backend** — Fastify 5 + Sequelize 6 + PostgreSQL 17, em camadas de rotas → controllers → services → models.

## Subindo tudo

```bash
cp .env.example .env      # ajuste DB_PASSWORD antes de qualquer coisa
docker compose up --build
```

- Site: <http://localhost:5173>
- API: <http://localhost:3001>
- Postgres: `localhost:5433`

Em desenvolvimento o backend aplica as migrations e roda o seed sozinho no
entrypoint (`RUN_SEEDS=true`), então um único `docker compose up` já entrega o
stack utilizável. O seed é idempotente: reiniciar não duplica nada.

> As portas 3001 e 5433 foram escolhidas porque 8080, 8081 e 5432 costumam estar
> ocupadas por outros projetos nesta máquina. Mude via `API_PORT_HOST`,
> `DB_PORT_HOST` e `WEB_PORT_HOST` no `.env`.

### Quem entra

Os usuários vêm do seed. A lista real fica em `backend/src/seeds/guests.json`,
que **está no `.gitignore`** — nomes reais e senhas nunca entram no histórico do
git. Sem esse arquivo o seed cai em `guests.example.json`, cujos quatro usuários
fictícios (`renato` e `marilia` como administradores, `ana.silva` e `joao.lima`
como convidados) usam a senha `troque-esta-senha`.

Para valer, copie o exemplo, preencha e rode o seed:

```bash
cp backend/src/seeds/guests.example.json backend/src/seeds/guests.json
$EDITOR backend/src/seeds/guests.json
docker compose exec backend npm run db:seed
```

**O convite é individual**: um login é uma pessoa e vale por um lugar. O RSVP é
uma resposta só — sim ou não — e não há acompanhantes. O campo "nome completo" do
formulário existe para o convidado informar como o nome deve aparecer na
recepção, que nem sempre é igual ao nome de exibição da conta.

## Produção

```bash
docker compose -f docker-compose.prod.yml up -d --build
# semear uma vez, à mão:
docker compose -f docker-compose.prod.yml run --rm backend npx sequelize-cli db:seed:all
```

O frontend é servido pelo nginx (build estático + fallback de histórico da SPA +
proxy de `/api`); `db` e `backend` não publicam porta nenhuma no host.

> ### Ao colocar TLS na frente, leia isto
>
> O stack de produção está configurado para **HTTP local**: `COOKIE_SECURE=false`.
> Um cookie marcado `Secure` é **descartado em silêncio** sobre HTTP puro —
> ninguém consegue entrar e não aparece erro em log nenhum.
>
> Quando houver HTTPS (Cloudflare, Traefik, nginx do host, Caddy…), mude em
> `docker-compose.prod.yml`:
>
> - `COOKIE_SECURE: "true"`
> - `TRUST_PROXY: "true"` (já está)
> - `PUBLIC_ORIGIN` no `.env` para a origem pública real

## Como o login funciona

O navegador só enxerga **uma origem**: o frontend sempre chama `/api/…`, e quem
encaminha para o backend é o proxy do Vite (dev) ou o nginx (prod), do lado do
servidor. Por isso:

- o cookie de sessão é `httpOnly`, `SameSite=Lax`, **sem atributo `domain`**;
- não há preflight de CORS em lugar nenhum;
- nada de identidade é espelhado em `localStorage`/`sessionStorage`.

A sessão é um token opaco de 256 bits. O banco guarda apenas o **sha256** dele —
um dump não entrega sessões vivas. A sessão é deslizante e vence em 30 dias.

## Rotas da API

| Método | Caminho | Acesso |
| --- | --- | --- |
| GET | `/health`, `/api/health` | público |
| POST | `/api/auth/login` | público (5 tentativas / 15 min por ip+usuário) |
| GET | `/api/auth/session` | sessão |
| POST | `/api/auth/logout` | idempotente |
| GET · PUT | `/api/rsvp` | convidado |
| GET | `/api/gifts` | convidado |
| POST · DELETE | `/api/gifts/:id/claim` | convidado |
| GET | `/api/admin/summary`, `/api/admin/rsvps` | administrador |
| GET · POST | `/api/admin/guests`, `/api/admin/gifts` | administrador |
| PATCH · DELETE | `/api/admin/guests/:id`, `/api/admin/gifts/:id` | administrador |
| POST | `/api/admin/guests/:id/password` | administrador |

Erros saem sempre no mesmo envelope, com mensagem em português (o frontend
exibe `message` cru na tela):

```json
{ "error": { "code": "GIFT_UNAVAILABLE",
             "message": "Alguém escolheu este presente antes de você." } }
```

## Banco de dados

Cinco tabelas: `users`, `sessions`, `rsvps` (uma por convidado), `gifts`,
`gift_claims`. O schema vem **só das migrations** — `sequelize.sync()` nunca é
chamado.

```bash
docker compose exec backend npm run db:migrate:status
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed
docker compose exec backend npm run db:reset     # apaga tudo e recria
```

`gifts.quantity` controla a exclusividade: `1` é item único, valores maiores são
cotas que várias pessoas podem dividir.

## Testes

```bash
docker compose exec backend npm test    # 47 testes
```

Rodam contra o banco `wedding_test`, criado por
`docker/postgres/init/01-create-test-db.sql`. **Esse script só roda com o volume
vazio** — se o volume já existia, crie o banco à mão:

```bash
docker compose exec db psql -U wedding -c 'CREATE DATABASE wedding_test;'
```

## Sem Docker

```bash
cd backend  && cp .env.example .env && npm install && npm run db:migrate && npm run db:seed && npm run dev
cd frontend && npm install && npm run dev
```

O `backend/.env` aponta para `localhost:5433` (a porta que o compose publica),
enquanto dentro dos containers as variáveis vêm do próprio compose.
