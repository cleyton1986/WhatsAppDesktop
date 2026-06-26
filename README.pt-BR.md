<div align="center">

# WhatsApp Desktop para Linux

**Um cliente desktop nativo não oficial para WhatsApp Web no Linux, para uso pessoal.**

🇺🇸 [Read in English](README.md)

[![Baixar AppImage](https://img.shields.io/badge/Baixar-AppImage%20(amd64)-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/cleyton1986/WhatsAppDesktop/releases/latest)

![Plataforma](https://img.shields.io/badge/Plataforma-Linux-yellow?logo=linux)
![Linguagem](https://img.shields.io/badge/Linguagem-TypeScript-blue?logo=typescript)
![Engine](https://img.shields.io/badge/Engine-Electron%2033-47848F?logo=electron)
![Licenca](https://img.shields.io/badge/Licenca-MIT-green)
![Versao](https://img.shields.io/badge/Versao-2.0.0-brightgreen)

</div>

---

## ⚠️ Aviso Legal

> **Este é um projeto pessoal e independente, sem qualquer afiliação, endosso ou conexão com a WhatsApp Inc., Meta Platforms, Inc. ou qualquer uma de suas subsidiárias.**
>
> "WhatsApp", "WhatsApp Web", "Meta" e seus logotipos e marcas registradas são propriedade exclusiva de seus respectivos donos. Todos os direitos reservados.
>
> Este projeto **não** modifica, realiza engenharia reversa, redistribui ou replica nenhum software ou serviço do WhatsApp. É simplesmente um wrapper nativo para Linux que carrega o aplicativo web oficial e publicamente disponível do WhatsApp (`web.whatsapp.com`) — exatamente como qualquer navegador faria. Nenhum código, recurso, API ou dado proprietário do WhatsApp está incluído ou redistribuído.
>
> Este projeto foi criado exclusivamente para uso pessoal, para preencher uma lacuna que existe no Linux, e é compartilhado abertamente caso ajude outras pessoas com a mesma necessidade. **Use por sua conta e risco.**
>
> Se você é um representante da WhatsApp Inc. ou da Meta e tem alguma preocupação com este projeto, por favor abra uma issue e ela será tratada prontamente.

---

## Por que isso existe

O WhatsApp disponibiliza um aplicativo nativo para Windows e macOS, mas **sem cliente oficial para Linux**. Este projeto foi criado para uso pessoal, para ter uma janela nativa sempre disponível — sem precisar manter uma aba do navegador aberta.

Ele encapsula o WhatsApp Web oficial em uma janela Electron, adicionando integrações com o ambiente Linux como bandeja do sistema, suporte a múltiplas contas, notificações com navegação para a conversa e muito mais.

## Funcionalidades

- 💬 **Multi-conta** — use Pessoal + Empresa (ou quantas quiser) simultaneamente, cada uma em janela e sessão isoladas
- 🏷️ **Emoji por conta** — atribua um emoji para identificar cada conta rapidamente
- 🎨 **Tema por conta** — Escuro / Claro / Sistema, configurado independentemente por conta
- 📌 **Bandeja do sistema** — minimiza para o tray ao fechar; ícone muda quando há mensagens não lidas
- 🔔 **Notificações com navegação** — clique na notificação para abrir a conversa diretamente
- 🔕 **Não Perturbe** — silencia todas as notificações manualmente ou por agendamento (ex: 22:00–07:00)
- 📥 **Downloads inteligentes** — salva automaticamente com nome no padrão do WhatsApp (`WhatsApp Image 2025-01-01 at 10.30.00.jpg`), lembra a última pasta usada
- 🎵 **Mini-player de áudio flutuante** — aparece automaticamente ao reproduzir mensagens de voz ou áudio
- 🚀 **Iniciar com o sistema** — abre minimizado na bandeja ao ligar o computador
- 🔗 **Deep linking** — suporta links `whatsapp://send?phone=...`
- 💾 **Persistência de janela** — salva tamanho e posição por conta entre sessões
- 🔍 **Controle de zoom** — `Ctrl++` / `Ctrl+-` / `Ctrl+0`
- 📤 **Exportar/Importar configurações** — backup e restauração completa em JSON

## Screenshots

<div align="center">

| Configurações | Seletor de emoji por conta |
|:---:|:---:|
| ![Tela de configurações](assets/img-01.png) | ![Seletor de emoji](assets/img-02.png) |

| Login (QR Code) | Multi-conta |
|:---:|:---:|
| ![Tela de login](assets/img-03.png) | ![Duas contas simultâneas](assets/img-04.png) |

</div>

## Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl+1`, `Ctrl+2`, ... | Focar conta 1, 2, ... |
| `Ctrl+Q` | Sair do aplicativo |
| `Ctrl+W` | Minimizar janela para o tray |
| `Ctrl+R` / `F5` | Recarregar página |
| `Ctrl++` / `Ctrl+-` | Aumentar / Diminuir zoom |
| `Ctrl+0` | Resetar zoom |

## Instalação

### One-liner (recomendado)

```bash
curl -fsSL https://github.com/cleyton1986/WhatsAppDesktop/releases/latest/download/install-online.sh | bash
```

Detecta automaticamente sua distro e instala via `.deb` (Debian/Ubuntu/Mint) ou AppImage (outras distros).

### Manual — Debian / Ubuntu / Mint (.deb)

```bash
sudo dpkg -i whatsapp-desktop-cleyton_2.0.0_amd64.deb
```

### Manual — Outras distros (AppImage)

```bash
chmod +x whatsapp-desktop-cleyton-2.0.0.AppImage
./whatsapp-desktop-cleyton-2.0.0.AppImage
```

Baixe a versão mais recente na [página de releases](../../releases).

## Compilar do código-fonte

### Dependências

- [Node.js](https://nodejs.org) 18+
- [Yarn](https://yarnpkg.com)

```bash
yarn install
yarn start        # modo desenvolvimento
yarn build        # gera o AppImage
```

## Como funciona

```
┌──────────────────────────────────────────────────┐
│  whatsapp-desktop (app Electron)                  │
│  ├─ AccountWindow (uma por conta)                 │
│  │   ├─ BrowserWindow ── web.whatsapp.com         │
│  │   ├─ Sessão isolada (persist:<id>)             │
│  │   └─ Gerenciador de downloads inteligente      │
│  ├─ Bandeja do sistema (badge + menu por conta)   │
│  ├─ Janela de notificação customizada (navegação) │
│  ├─ Mini-player de áudio flutuante                │
│  └─ Janela de configurações                       │
└──────────────────────────────────────────────────┘
```

## Testado em

| Distribuição | Desktop | Sessão | Status |
|---|:---:|:---:|:---:|
| **Linux Mint 22.3** | Cinnamon | X11 | ✅ |
| Ubuntu 24.04 | GNOME | X11 | 🟡 |
| Outras baseadas em Debian | qualquer | X11 | 🟡 |
| Qualquer distro | qualquer | Wayland | 🟡 |

> ✅ Confirmado funcionando · 🟡 Esperado funcionar, não testado

## Tecnologias

- [Electron](https://www.electronjs.org/) 33+
- [TypeScript](https://www.typescriptlang.org/) 5+
- [electron-store](https://github.com/sindresorhus/electron-store) — persistência de configurações
- [electron-builder](https://www.electron.build/) — empacotamento AppImage

## Apoie o Projeto

Se este projeto foi útil para você e deseja apoiar o seu desenvolvimento, considere me pagar um café:

<p align="center">
  <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=cleyton1986%40gmail.com&currency_code=BRL&item_name=WhatsApp+Desktop+para+Linux">
    <img src="https://img.shields.io/badge/PayPal-Doar-00457C?logo=paypal&logoColor=white&style=for-the-badge" alt="Doar via PayPal">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PIX-cleyton1986%40gmail.com-077C6C?logo=pix&logoColor=white&style=for-the-badge" alt="PIX">
</p>

Qualquer contribuição é voluntária e muito apreciada!

## Licença

[MIT](LICENSE) — Esta licença cobre apenas o código do wrapper neste repositório.  
WhatsApp, WhatsApp Web e todos os serviços relacionados permanecem propriedade da WhatsApp Inc. e da Meta Platforms, Inc.
