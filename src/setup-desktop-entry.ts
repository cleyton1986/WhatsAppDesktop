import * as fs from "fs";
import * as path from "path";
import os from "os";
import { exec } from "child_process";

/**
 * Configura o desktop entry para deep linking e atalho no menu.
 * Cria ou atualiza o arquivo ~/.local/share/applications/whatsapp-desktop-cleyton.desktop.
 */
export function setupDesktopEntry() {
  const homeDir = os.homedir();
  const applicationsDir = path.join(homeDir, ".local", "share", "applications");
  const desktopFilePath = path.join(
    applicationsDir,
    "whatsapp-desktop-cleyton.desktop"
  );

  // Usa o caminho real do executavel (AppImage ou binario local)
  const execPath = process.env.APPIMAGE || process.execPath;

  const desktopEntryContent = `[Desktop Entry]
Type=Application
Name=WhatsApp Desktop
Comment=Aplicativo WhatsApp Desktop (github.cleyton1986.WhatsAppDesktop)
Exec=${execPath} %u
StartupNotify=false
MimeType=x-scheme-handler/whatsapp;
Categories=Network;InstantMessaging;
Icon=whatsapp.svg
Terminal=false
StartupWMClass=whatsapp-desktop-cleyton
`;

  // Cria o diretorio, se necessario
  if (!fs.existsSync(applicationsDir)) {
    fs.mkdirSync(applicationsDir, { recursive: true });
  }

  // Verifica se o arquivo precisa ser atualizado
  let writeFile = false;
  if (fs.existsSync(desktopFilePath)) {
    const existingContent = fs.readFileSync(desktopFilePath, "utf-8");
    if (existingContent !== desktopEntryContent) {
      writeFile = true;
    }
  } else {
    writeFile = true;
  }

  if (writeFile) {
    fs.writeFileSync(desktopFilePath, desktopEntryContent, { mode: 0o644 });
    console.log("Desktop entry atualizado:", desktopFilePath);
  }

  // Registra o handler do protocolo whatsapp com xdg-mime
  exec(
    `xdg-mime default whatsapp-desktop-cleyton.desktop x-scheme-handler/whatsapp`,
    (error) => {
      if (error) {
        console.error(`Erro ao registrar handler do protocolo whatsapp: ${error.message}`);
        return;
      }
      console.log("Handler do protocolo whatsapp registrado com sucesso.");
    }
  );
}
