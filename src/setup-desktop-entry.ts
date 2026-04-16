import * as fs from "fs";
import * as path from "path";
import os from "os";
import { exec } from "child_process";

/**
 * Configura o desktop entry para o deep linking e atalho.
 * Cria ou atualiza o arquivo ~/.local/share/applications/whatsapp-desktop-cleyton.desktop.
 */
export function setupDesktopEntry() {
  const homeDir = os.homedir();
  const applicationsDir = path.join(homeDir, ".local", "share", "applications");
  const desktopFilePath = path.join(
    applicationsDir,
    "whatsapp-desktop-cleyton.desktop"
  );

  const desktopEntryContent = `[Desktop Entry]
Type=Application
Name=WhatsApp Desktop
Comment=Aplicativo WhatsApp Desktop (github.cleyton1986.WhatsAppDesktop)
Exec=whatsapp-desktop-cleyton %u
StartupNotify=false
MimeType=x-scheme-handler/whatsapp;
Categories=Network;InstantMessaging;
Icon=whatsapp.svg
Terminal=false
`;

  // Cria o diretório, se necessário.
  if (!fs.existsSync(applicationsDir)) {
    fs.mkdirSync(applicationsDir, { recursive: true });
    console.log("Diretório de aplicações criado:", applicationsDir);
  }

  // Verifica se o arquivo já existe e se o conteúdo está atualizado.
  let writeFile = false;
  if (fs.existsSync(desktopFilePath)) {
    const existingContent = fs.readFileSync(desktopFilePath, "utf-8");
    if (existingContent !== desktopEntryContent) {
      writeFile = true;
      console.log(
        "Desktop entry existente, mas o conteúdo está desatualizado. Atualizando..."
      );
    } else {
      console.log(
        "Desktop entry já existe e está atualizado:",
        desktopFilePath
      );
    }
  } else {
    writeFile = true;
    console.log("Desktop entry não encontrado. Criando novo arquivo...");
  }

  if (writeFile) {
    fs.writeFileSync(desktopFilePath, desktopEntryContent, { mode: 0o644 });
    console.log("Desktop entry escrito em:", desktopFilePath);
  }

  // Registra o handler do protocolo whatsapp com xdg-mime.
  exec(
    `xdg-mime default whatsapp-desktop-cleyton.desktop x-scheme-handler/whatsapp`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(
          `Erro ao registrar handler do protocolo whatsapp: ${error.message}`
        );
        return;
      }
      console.log(
        `Handler do protocolo whatsapp registrado com sucesso: ${stdout}`
      );
    }
  );
}
