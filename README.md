# WhatsApp Desktop for Linux (unofficial)

WhatsApp Desktop for Linux (unofficial) – maintained by Cleyton Alves ([cleyton1986/WhatsAppDesktop](https://github.com/cleyton1986/WhatsAppDesktop)).

Um wrapper para [WhatsApp Web](https://web.whatsapp.com/) desenvolvido com Electron, permitindo usar o WhatsApp em ambiente desktop no Linux.

## Funcionalidades

- **Multi-conta**: conecte multiplas contas WhatsApp simultaneamente
- **Bandeja do sistema**: o app minimiza para o tray ao fechar a janela
- **Notificacao de mensagens**: icone do tray muda quando ha mensagens nao lidas
- **Deep linking**: suporte a links `whatsapp://send?phone=...`
- **Atalhos de teclado**: Ctrl+Q (sair), Ctrl+W (minimizar), Ctrl+R/F5 (recarregar), Ctrl+/- (zoom)
- **Persistencia de janela**: salva tamanho e posicao da janela por conta
- **Tela de configuracoes**: gerenciar contas (adicionar, remover, renomear)

## Disclaimer

Este aplicativo apenas carrega o WhatsApp Web com funcionalidades adicionais.
Nao altera o conteudo oficial da pagina e nao e verificado, afiliado ou suportado pela WhatsApp Inc.

## Instalacao

### AppImage

Baixe a versao AppImage na [pagina de releases](https://github.com/cleyton1986/WhatsAppDesktop/releases).

```bash
chmod +x whatsapp-desktop-cleyton-2.0.0.AppImage
./whatsapp-desktop-cleyton-2.0.0.AppImage
```

### Instalacao via script

```bash
# Build
yarn install
yarn build

# Instalar
cd installer
./install.sh
```

## Desenvolvimento

```bash
yarn install
yarn start
```

## Tecnologias

- Electron 33+
- TypeScript 5+
- electron-store (persistencia de configuracoes)
- electron-builder (empacotamento)
