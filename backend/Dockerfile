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
RUN chmod +x scripts/docker-entrypoint.sh && chown -R node:node /app
USER node
EXPOSE 3001
CMD ["node", "src/server.js"]
