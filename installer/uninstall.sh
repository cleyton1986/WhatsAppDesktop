#!/bin/bash
# Script de desinstalação do WhatsApp Desktop para Linux (AppImage)
# Remove o symlink, o diretório de instalação e o desktop entry.

INSTALL_DIR="/opt/whatsapp-desktop-cleyton"
BIN_LINK="/usr/local/bin/whatsapp-desktop-cleyton"
DESKTOP_ENTRY="$HOME/.local/share/applications/whatsapp-desktop-cleyton.desktop"

echo "Iniciando a desinstalação do WhatsApp Desktop..."

# Remove o symlink
if [ -L "$BIN_LINK" ]; then
    echo "Removendo symlink em $BIN_LINK..."
    sudo rm "$BIN_LINK"
else
    echo "Symlink $BIN_LINK não encontrado."
fi

# Remove o diretório de instalação
if [ -d "$INSTALL_DIR" ]; then
    echo "Removendo diretório de instalação $INSTALL_DIR..."
    sudo rm -rf "$INSTALL_DIR"
else
    echo "Diretório de instalação $INSTALL_DIR não encontrado."
fi

# Remove o desktop entry
if [ -f "$DESKTOP_ENTRY" ]; then
    echo "Removendo desktop entry $DESKTOP_ENTRY..."
    rm "$DESKTOP_ENTRY"
else
    echo "Desktop entry $DESKTOP_ENTRY não encontrado."
fi

# Atualiza o database de desktop entries, se disponível
if command -v update-desktop-database >/dev/null 2>&1; then
    echo "Atualizando desktop database..."
    update-desktop-database "$HOME/.local/share/applications"
fi

echo "Desinstalação concluída."
echo "Caso o handler do protocolo 'whatsapp:' continue ativo, reinicie o sistema para garantir que todas as associações sejam removidas."
