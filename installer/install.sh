#!/bin/bash
# Script de instalação do WhatsApp Desktop para Linux (AppImage)
# Esse script assume que está localizado na pasta "installer" e que o AppImage está em "../build/whatsapp-desktop-cleyton-1.2.3-2.AppImage"

# Determina o diretório deste script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Caminho absoluto para o AppImage na pasta build
APPIMAGE_PATH="$SCRIPT_DIR/../build/whatsapp-desktop-cleyton-1.2.3-2.AppImage"

INSTALL_DIR="/opt/whatsapp-desktop-cleyton"
BIN_LINK="/usr/local/bin/whatsapp-desktop-cleyton"
DESKTOP_ENTRY="$HOME/.local/share/applications/whatsapp-desktop-cleyton.desktop"
ICON_SOURCE="$SCRIPT_DIR/../data/icons/hicolor/512x512/apps/whatsapp-desktop-cleyton.png"
ICON_DEST="$INSTALL_DIR/whatsapp.svg"

echo "Iniciando instalação do WhatsApp Desktop..."

# Verifica se o arquivo AppImage existe
if [ ! -f "$APPIMAGE_PATH" ]; then
  echo "Erro: Arquivo '$APPIMAGE_PATH' não encontrado."
  exit 1
fi

# Dá permissão de execução no arquivo AppImage de origem (na pasta build)
echo "Definindo permissões de execução para o arquivo fonte..."
chmod +x "$APPIMAGE_PATH"

# Cria o diretório de instalação (requer sudo)
echo "Criando diretório de instalação em $INSTALL_DIR..."
sudo mkdir -p "$INSTALL_DIR"

# Copia o AppImage para o diretório de instalação
echo "Copiando '$APPIMAGE_PATH' para $INSTALL_DIR..."
sudo cp "$APPIMAGE_PATH" "$INSTALL_DIR/"

# Garante que o AppImage copiado tenha permissão de execução
echo "Definindo permissões de execução para o AppImage no diretório de instalação..."
sudo chmod +x "$INSTALL_DIR/whatsapp-desktop-cleyton-1.2.3-2.AppImage"

# Cria um symlink em /usr/local/bin para facilitar a execução
echo "Criando symlink em $BIN_LINK..."
sudo ln -sf "$INSTALL_DIR/whatsapp-desktop-cleyton-1.2.3-2.AppImage" "$BIN_LINK"

# Copia o ícone (se existir) para o diretório de instalação
if [ -f "$ICON_SOURCE" ]; then
  echo "Copiando ícone para $ICON_DEST..."
  sudo cp "$ICON_SOURCE" "$ICON_DEST"
else
  echo "Ícone não encontrado em $ICON_SOURCE. O desktop entry usará o ícone padrão do sistema."
fi

# Cria o diretório para desktop entry, se necessário
mkdir -p "$HOME/.local/share/applications"

# Cria ou atualiza o arquivo desktop entry
echo "Criando/Atualizando desktop entry em $DESKTOP_ENTRY..."
cat > "$DESKTOP_ENTRY" <<EOF
[Desktop Entry]
Type=Application
Name=WhatsApp Desktop
Comment=Aplicativo WhatsApp Desktop (github.cleyton1986.WhatsAppDesktop)
Exec=$BIN_LINK %u
StartupNotify=false
MimeType=x-scheme-handler/whatsapp;
Categories=Network;InstantMessaging;
Icon=$ICON_DEST
Terminal=false
EOF

# Atualiza o database de desktop entries (se disponível)
if command -v update-desktop-database >/dev/null 2>&1; then
  echo "Atualizando desktop database..."
  update-desktop-database "$HOME/.local/share/applications"
fi

# Registra o handler do protocolo whatsapp
echo "Registrando o handler do protocolo whatsapp..."
xdg-mime default whatsapp-desktop-cleyton.desktop x-scheme-handler/whatsapp

echo "Instalação concluída."
echo "Você pode iniciar o WhatsApp Desktop executando 'whatsapp-desktop-cleyton' no terminal ou pelo menu de aplicativos."
