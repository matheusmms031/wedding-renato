#!/usr/bin/env bash
#
# Instala Docker Engine + plugin do Compose v2 numa VM Debian/Ubuntu limpa.
#
# Usa o repositório oficial da Docker, não o `docker.io` do Ubuntu: o pacote da
# distro costuma vir sem o plugin do compose, e é dele que vem o "docker:
# 'compose' is not a docker command" que trava o deploy.
#
# Instala `docker compose` (subcomando, v2), não o `docker-compose` (binário
# Python, v1, descontinuado). Os arquivos deste repositório usam a sintaxe v2.
#
# Idempotente: rodar de novo não reinstala o que já está lá.
#
#   curl -fsSL https://raw.githubusercontent.com/matheusmms031/wedding-renato/main/scripts/install-docker.sh | bash
#   ./scripts/install-docker.sh

set -euo pipefail

log()  { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m/!\\\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31mERRO:\033[0m %s\n' "$*" >&2; exit 1; }

# Root já tem tudo; fora dele, precisa de sudo.
if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
else
  command -v sudo >/dev/null || die "não sou root e não há sudo instalado."
  SUDO="sudo"
fi

[ -r /etc/os-release ] || die "não achei /etc/os-release — distro não identificada."
# shellcheck disable=SC1091
. /etc/os-release

case "${ID:-}${ID_LIKE:-}" in
  *debian*|*ubuntu*) : ;;
  *) die "este script cobre apenas Debian/Ubuntu (detectado: ${ID:-desconhecido}). Veja https://docs.docker.com/engine/install/" ;;
esac

# Derivadas (Linux Mint, Pop!_OS) trazem o codinome do Ubuntu numa variável
# própria; sem isso o repositório aponta para uma suíte que não existe.
CODENAME="${UBUNTU_CODENAME:-${VERSION_CODENAME:-}}"
[ -n "$CODENAME" ] || die "não consegui determinar o codinome da distro."

case "${ID:-}" in
  ubuntu) REPO="ubuntu" ;;
  debian) REPO="debian" ;;
  *) case "${ID_LIKE:-}" in *ubuntu*) REPO="ubuntu" ;; *) REPO="debian" ;; esac ;;
esac

if command -v docker >/dev/null && docker compose version >/dev/null 2>&1; then
  log "Docker e Compose v2 já instalados:"
  docker --version
  docker compose version
  exit 0
fi

log "Instalando pré-requisitos…"
$SUDO apt-get update -qq
$SUDO apt-get install -y -qq ca-certificates curl gnupg

log "Adicionando a chave e o repositório oficiais da Docker ($REPO/$CODENAME)…"
$SUDO install -m 0755 -d /etc/apt/keyrings
$SUDO curl -fsSL "https://download.docker.com/linux/$REPO/gpg" -o /etc/apt/keyrings/docker.asc
$SUDO chmod a+r /etc/apt/keyrings/docker.asc

ARCH="$(dpkg --print-architecture)"
echo "deb [arch=$ARCH signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/$REPO $CODENAME stable" \
  | $SUDO tee /etc/apt/sources.list.d/docker.list >/dev/null

log "Instalando Docker Engine e plugins…"
$SUDO apt-get update -qq
$SUDO apt-get install -y -qq \
  docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Em container não há systemd; numa VM de verdade há.
if command -v systemctl >/dev/null && systemctl list-units >/dev/null 2>&1; then
  log "Habilitando o serviço…"
  $SUDO systemctl enable --now docker
fi

if [ "$(id -u)" -ne 0 ]; then
  if id -nG "$USER" | tr ' ' '\n' | grep -qx docker; then
    log "$USER já está no grupo docker."
  else
    log "Adicionando $USER ao grupo docker…"
    $SUDO usermod -aG docker "$USER"
    warn "Saia e entre de novo (ou rode 'newgrp docker') para usar docker sem sudo."
  fi
fi

log "Pronto:"
docker --version
docker compose version
