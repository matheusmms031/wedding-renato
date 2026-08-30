-- Banco usado pela suíte de testes do backend.
-- ATENÇÃO: scripts em /docker-entrypoint-initdb.d só rodam quando o volume de
-- dados está vazio. Se o volume já existe, crie o banco à mão:
--   docker compose exec db psql -U wedding -c 'CREATE DATABASE wedding_test;'
CREATE DATABASE wedding_test;
