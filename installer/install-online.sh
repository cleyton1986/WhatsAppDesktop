#!/bin/bash
# WhatsApp Desktop for Linux — instalador online
# Uso: curl -fsSL https://github.com/cleyton1986/WhatsAppDesktop/releases/latest/download/install-online.sh | bash

set -e

REPO="cleyton1986/WhatsAppDesktop"
APP_NAME="whatsapp-desktop-cleyton"
INSTALL_DIR="/opt/whatsapp-desktop-cleyton"
BIN_LINK="/usr/local/bin/whatsapp-desktop-cleyton"
DESKTOP_DIR="$HOME/.local/share/applications"
DESKTOP_FILE="$DESKTOP_DIR/whatsapp-desktop-cleyton.desktop"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo "  WhatsApp Desktop for Linux — Instalador"
echo "  ----------------------------------------"
echo ""

# Detecta versão mais recente via GitHub API
info "Verificando versão mais recente..."
LATEST=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
  | grep '"tag_name"' | head -1 | sed 's/.*"tag_name": *"\(.*\)".*/\1/')

if [ -z "$LATEST" ]; then
  error "Não foi possível obter a versão mais recente. Verifique sua conexão."
fi

VERSION="${LATEST#v}"
info "Versão encontrada: $LATEST"

BASE_URL="https://github.com/$REPO/releases/download/$LATEST"

# Detecta se é distro baseada em Debian
install_deb() {
  local DEB_FILE="/tmp/${APP_NAME}_${VERSION}_amd64.deb"
  local DEB_URL="$BASE_URL/${APP_NAME}_${VERSION}_amd64.deb"

  info "Baixando pacote .deb..."
  curl -fsSL --progress-bar "$DEB_URL" -o "$DEB_FILE"

  info "Instalando .deb (requer sudo)..."
  sudo dpkg -i "$DEB_FILE" || sudo apt-get -f install -y

  rm -f "$DEB_FILE"
  info "Instalação via .deb concluída."
}

# Instala via AppImage em outras distros
install_appimage() {
  local APPIMAGE_NAME="${APP_NAME}-${VERSION}.AppImage"
  local APPIMAGE_URL="$BASE_URL/$APPIMAGE_NAME"
  local TMP_FILE="/tmp/$APPIMAGE_NAME"

  info "Baixando AppImage..."
  curl -fsSL --progress-bar "$APPIMAGE_URL" -o "$TMP_FILE"
  chmod +x "$TMP_FILE"

  info "Instalando AppImage (requer sudo)..."
  sudo mkdir -p "$INSTALL_DIR"
  sudo cp "$TMP_FILE" "$INSTALL_DIR/$APPIMAGE_NAME"
  sudo chmod +x "$INSTALL_DIR/$APPIMAGE_NAME"
  sudo ln -sf "$INSTALL_DIR/$APPIMAGE_NAME" "$BIN_LINK"

  rm -f "$TMP_FILE"

  # Cria .desktop entry
  mkdir -p "$DESKTOP_DIR"
  cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Name=WhatsApp Desktop
Comment=Unofficial WhatsApp Web desktop client for Linux
Exec=$BIN_LINK %u
StartupNotify=false
MimeType=x-scheme-handler/whatsapp;
Categories=Network;InstantMessaging;
Icon=whatsapp
Terminal=false
StartupWMClass=whatsapp-desktop-cleyton
EOF

  if command -v update-desktop-database &>/dev/null; then
    update-desktop-database "$DESKTOP_DIR"
  fi

  xdg-mime default whatsapp-desktop-cleyton.desktop x-scheme-handler/whatsapp 2>/dev/null || true

  info "Instalação via AppImage concluída."
}

# Decide método de instalação
if command -v dpkg &>/dev/null && command -v apt-get &>/dev/null; then
  info "Distro baseada em Debian detectada — usando .deb"
  install_deb
else
  warn "Distro não baseada em Debian — usando AppImage"
  install_appimage
fi

echo ""
info "WhatsApp Desktop v${VERSION} instalado com sucesso!"
echo ""
echo "  Execute no terminal:  whatsapp-desktop-cleyton"
echo "  Ou abra pelo menu de aplicativos: WhatsApp Desktop"
echo ""
