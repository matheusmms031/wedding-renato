# Deploy na VPS da Azure

Sobe tudo numa VM só: Postgres, API, front e TLS. Não depende de Netlify,
Render nem Supabase.

```
internet ──443──> caddy (TLS, Let's Encrypt)
                    └──> frontend (nginx: serve o dist + proxy /api)
                           └──> backend (Fastify) ──> db (Postgres)
```

Só o Caddy publica portas. Postgres e API não são alcançáveis de fora.

---

## 1. Abrir as portas na Azure

No Network Security Group da VM, libere **80**, **443** e **22**.

A 80 é obrigatória mesmo com o site em HTTPS: é por ela que o Let's Encrypt
valida o domínio. Sem ela o certificado nunca é emitido.

## 2. Apontar o domínio

Um registro `A` do seu domínio para o IP público da VM.

Sem domínio próprio, use o DNS grátis da Azure: na VM, *Configuration → DNS
name label*, o que dá `<rotulo>.<regiao>.cloudapp.azure.com`. O Let's Encrypt
emite certificado para esse domínio normalmente.

Confirme antes de seguir — o Caddy falha se o DNS não estiver propagado:

```bash
dig +short casamento.exemplo.com    # tem que devolver o IP da VM
```

## 3. Docker + Compose na VM

```bash
./scripts/install-docker.sh
newgrp docker    # ou saia e entre de novo na sessão
```

Se o código ainda não estiver na VM, o script roda direto do repositório:

```bash
curl -fsSL https://raw.githubusercontent.com/matheusmms031/wedding-renato/main/scripts/install-docker.sh | bash
```

Ele usa o repositório oficial da Docker, e não o `docker.io` do Ubuntu — o
pacote da distro vem sem o plugin do Compose, e é dele que sai o erro
`docker: 'compose' is not a docker command`, que trava o deploy no passo 6.
É idempotente: rodar de novo não reinstala nada.

## 4. Levar o código

**Via git** (preferível — atualizar depois é um `git pull`):

```bash
git clone git@github.com:matheusmms031/wedding-renato.git
cd wedding-renato
```

**Ou via rsync**, direto da sua máquina, sem depender do GitHub:

```bash
rsync -av --exclude node_modules --exclude dist --exclude .git \
  ~/Documentos/wedding-renato/ azureuser@<ip>:~/wedding-renato/
```

## 5. Configurar o `.env`

```bash
cp .env.example .env
nano .env
```

Obrigatórios:

| Variável | Valor |
|---|---|
| `DB_PASSWORD` | **troque** — o padrão do exemplo é público |
| `DOMAIN` | `casamento.exemplo.com` |
| `TLS_EMAIL` | seu e-mail, para avisos de expiração |

`CORS_ORIGIN` é derivado do `DOMAIN` automaticamente, não precisa mexer.

## 6. Subir

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml up -d --build
```

As migrations rodam sozinhas: o ENTRYPOINT do backend executa
`sequelize-cli db:migrate` antes de iniciar o Node, a cada deploy.

O primeiro `up` demora — o front é buildado na VM. **Numa VM de 1 GB o build
do Vite pode morrer por falta de memória.** Se acontecer, crie swap:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
```

Acompanhe a emissão do certificado:

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml logs -f caddy
```

## 7. Cadastrar os convidados

`backend/src/seeds/guests.json` é gitignored de propósito (48 senhas em texto
puro), então **não vem pelo git clone**. Copie da sua máquina:

```bash
scp backend/src/seeds/guests.json azureuser@<ip>:~/wedding-renato/backend/src/seeds/
```

E importe — o arquivo entra no container só na hora e sai logo depois, para
não ficar residente numa imagem:

```bash
cd ~/wedding-renato

# Função em vez de variável: `C="docker compose …"` seguido de `$C` não faz
# word splitting no zsh e falha com "command not found".
compose() { docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml "$@"; }

compose cp backend/src/seeds/guests.json backend:/app/src/seeds/guests.json
compose exec backend npm run db:guests
compose exec backend rm /app/src/seeds/guests.json
```

A lista de presentes (essa sim versionada):

```bash
compose exec backend npx sequelize-cli db:seed --seed 20260901010100-seed-gifts.cjs
```

> ⚠️ **Nunca ligue `RUN_SEEDS=true`.** Sem o `guests.json`, o seeder cai no
> `guests.example.json` e cria `renato`, `marilia`, `ana.silva` e `joao.lima`
> em produção com a senha `troque-esta-senha`.

## 8. Conferir

```bash
curl -I  https://casamento.exemplo.com/            # 200, e certificado válido
curl -s  https://casamento.exemplo.com/api/health  # {"status":"ok","db":"ok"}
curl -sI http://casamento.exemplo.com/ | head -1   # 308: o Caddy redireciona para HTTPS
```

Se o `/api/health` responder `503` com `"db":"down"`, o Postgres não subiu —
veja `compose logs db`.

## 9. Atualizar depois

```bash
git pull
docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml up -d --build
```

Os certificados ficam no volume `caddy-data` e sobrevivem a isso. Não apague
esse volume: o Let's Encrypt limita 5 emissões por domínio por semana.

## 10. Os volumes que precisam sobreviver

São **três**, e o `docker compose down -v` apaga todos:

| Volume | O que guarda | Coberto por dump do Postgres? |
|---|---|---|
| `db-data` | Banco: convidados, RSVPs, presentes | sim |
| `uploads-data` | **Imagens dos presentes** | **não** |
| `caddy-data` | Certificado TLS | não (reemitível) |

O `uploads-data` é a pegadinha: um backup só do banco deixa os presentes sem
foto. Para copiá-lo:

```bash
docker run --rm -v wedding-renato-prod_uploads-data:/dados -v "$PWD":/backup \
  alpine tar czf /backup/uploads.tar.gz -C /dados .
```
