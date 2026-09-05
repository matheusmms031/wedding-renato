# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app
# tini como PID 1: sem ele o SIGTERM do `compose down` não chega ao Node e o
# hook onClose nunca fecha o pool do Sequelize.
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--", "/app/scripts/docker-entrypoint.sh"]

FROM base AS deps-dev
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS deps-prod
ENV NODE_ENV=production
COPY package.json package-lock.json ./
# sequelize-cli está em dependencies de propósito: o entrypoint precisa do
# binário depois deste --omit=dev.
RUN npm ci --omit=dev

FROM deps-dev AS dev
ENV NODE_ENV=development
COPY . .
RUN chmod +x scripts/docker-entrypoint.sh
EXPOSE 3001
CMD ["npm", "run", "dev"]

FROM base AS prod
ENV NODE_ENV=production
COPY --from=deps-prod /app/node_modules ./node_modules
COPY . .
# O mkdir de /app/uploads precisa acontecer AQUI, e não só em runtime.
#
# Ao montar um volume vazio, o Docker copia dono e permissões do diretório que
# existe na imagem. Se ele não existir, o volume nasce root:root e o processo,
# que roda como `node`, falha com EACCES na primeira gravação.
#
# Sem esta linha o upload funciona na máquina de quem já rodou o projeto (a
# pasta local entra na imagem pelo COPY) e quebra em qualquer clone limpo —
# que é justamente o servidor.
RUN mkdir -p /app/uploads \
  && chmod +x scripts/docker-entrypoint.sh \
  && chown -R node:node /app
USER node
EXPOSE 3001
CMD ["node", "src/server.js"]
