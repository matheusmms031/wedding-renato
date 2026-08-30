#!/bin/sh
set -e

echo "[entrypoint] aplicando migrations…"
npx sequelize-cli db:migrate

if [ "${RUN_SEEDS:-false}" = "true" ]; then
  echo "[entrypoint] rodando seeders…"
  npx sequelize-cli db:seed:all
fi

exec "$@"
