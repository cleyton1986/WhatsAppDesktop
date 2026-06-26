<div align="center">

# WhatsApp Desktop for Linux

**An unofficial, personal-use native desktop client for WhatsApp Web on Linux.**

🇧🇷 [Leia em Português](README.pt-BR.md)

[![Download AppImage](https://img.shields.io/badge/Download-AppImage%20(amd64)-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/cleyton1986/WhatsAppDesktop/releases/latest)

![Platform](https://img.shields.io/badge/Platform-Linux-yellow?logo=linux)
![Language](https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript)
![Engine](https://img.shields.io/badge/Engine-Electron%2033-47848F?logo=electron)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-2.0.0-brightgreen)

</div>

---

## ⚠️ Legal Disclaimer

> **This is an unofficial, independent personal project, not affiliated with, endorsed by, or in any way connected to WhatsApp Inc., Meta Platforms, Inc., or any of their subsidiaries.**
>
> "WhatsApp", "WhatsApp Web", "Meta" and their logos and trademarks are the exclusive property of their respective owners. All rights reserved.
>
> This project **does not** modify, reverse-engineer, redistribute, or replicate any WhatsApp software or service. It is simply a native Linux window wrapper that loads the **official, publicly available** WhatsApp Web application (`web.whatsapp.com`) — exactly as any web browser would. No WhatsApp code, assets, APIs, or proprietary data are included or redistributed.
>
> This project was created solely for personal use, to fill a gap that exists on Linux, and is shared openly in case it helps others with the same need. **Use it at your own risk.**
>
> If you are a representative of WhatsApp Inc. or Meta and have any concerns about this project, please open an issue and it will be addressed promptly.

---

## Why this exists

WhatsApp ships a native app for Windows and macOS, but **no official Linux desktop client**. This project was built for personal use to have a proper, always-available native window — without keeping a browser tab open.

It wraps the official WhatsApp Web in an Electron window, adding Linux desktop integrations like system tray, multi-account support, notifications with conversation navigation, and more.

## Features

- 💬 **Multi-account** — run Personal + Business (or any number) simultaneously, each in its own isolated window and session
- 🏷️ **Emoji per account** — assign a custom emoji to identify each account at a glance
- 🎨 **Theme per account** — Dark / Light / System, set independently for each account
- 📌 **System tray** — minimizes to tray on close; icon changes when there are unread messages
- 🔔 **Notifications with navigation** — click a notification to open the exact conversation
- 🔕 **Do Not Disturb** — silence all notifications manually or on a schedule (e.g. 22:00–07:00)
- 📥 **Smart downloads** — auto-saves files with WhatsApp-style names (`WhatsApp Image 2025-01-01 at 10.30.00.jpg`), remembers last folder
- 🎵 **Floating audio mini-player** — appears automatically when playing voice messages or audio
- 🚀 **Start on login** — opens minimized to tray at system startup
- 🔗 **Deep linking** — handles `whatsapp://send?phone=...` links
- 💾 **Window persistence** — saves size and position per account between sessions
- 🔍 **Zoom control** — `Ctrl++` / `Ctrl+-` / `Ctrl+0`
- 📤 **Export/Import settings** — full backup and restore as JSON

## Screenshots

<div align="center">

| Settings | Emoji picker per account |
|:---:|:---:|
| ![Settings screen](assets/img-01.png) | ![Emoji picker](assets/img-02.png) |

| Login (QR Code) | Multi-account |
|:---:|:---:|
| ![Login screen](assets/img-03.png) | ![Two accounts side by side](assets/img-04.png) |

</div>

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+1`, `Ctrl+2`, ... | Focus account 1, 2, ... |
| `Ctrl+Q` | Quit the application |
| `Ctrl+W` | Minimize window to tray |
| `Ctrl+R` / `F5` | Reload page |
| `Ctrl++` / `Ctrl+-` | Zoom in / out |
| `Ctrl+0` | Reset zoom |

## Install (prebuilt AppImage)

Download the latest AppImage from the [Releases](../../releases) page:

```bash
chmod +x whatsapp-desktop-cleyton-2.0.0.AppImage
./whatsapp-desktop-cleyton-2.0.0.AppImage
```

### Install via script (system-wide)

```bash
yarn install
yarn build

cd installer
./install.sh
```

This installs the AppImage to `/opt/`, creates a symlink in `/usr/local/bin/`, and registers the `.desktop` entry so the app appears in your application menu.

## Build from source

### Dependencies

- [Node.js](https://nodejs.org) 18+
- [Yarn](https://yarnpkg.com)

```bash
yarn install
yarn start        # development mode
yarn build        # build AppImage
```

## How it works

```
┌──────────────────────────────────────────────────┐
│  whatsapp-desktop (Electron app)                  │
│  ├─ AccountWindow (one per account)               │
│  │   ├─ BrowserWindow ── web.whatsapp.com         │
│  │   ├─ Isolated session (persist:<id>)           │
│  │   └─ Smart download handler                    │
│  ├─ System tray (unread badge + per-account menu) │
│  ├─ Custom notification window (with navigation)  │
│  ├─ Floating audio mini-player                    │
│  └─ Config window (settings UI)                   │
└──────────────────────────────────────────────────┘
```

## Tested on

| Distribution | Desktop | Session | Status |
|---|:---:|:---:|:---:|
| **Linux Mint 22.3** | Cinnamon | X11 | ✅ |
| Ubuntu 24.04 | GNOME | X11 | 🟡 |
| Other Debian-based | any | X11 | 🟡 |
| Any distro | any | Wayland | 🟡 |

> ✅ Confirmed working · 🟡 Expected to work, not tested

## Tech stack

- [Electron](https://www.electronjs.org/) 33+
- [TypeScript](https://www.typescriptlang.org/) 5+
- [electron-store](https://github.com/sindresorhus/electron-store) — settings persistence
- [electron-builder](https://www.electron.build/) — AppImage packaging

## Support the Project

If this project was useful to you and you'd like to support its development, consider buying me a coffee:

<p align="center">
  <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=cleyton1986%40gmail.com&currency_code=BRL&item_name=WhatsApp+Desktop+for+Linux">
    <img src="https://img.shields.io/badge/PayPal-Donate-00457C?logo=paypal&logoColor=white&style=for-the-badge" alt="Donate via PayPal">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PIX-cleyton1986%40gmail.com-077C6C?logo=pix&logoColor=white&style=for-the-badge" alt="PIX">
</p>

Any contribution is voluntary and greatly appreciated!

## License

[MIT](LICENSE) — This license covers only the wrapper code in this repository.  
WhatsApp, WhatsApp Web, and all related services remain the property of WhatsApp Inc. and Meta Platforms, Inc.
