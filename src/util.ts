import { app, nativeImage } from "electron";
import fs from "fs";
import path from "path";

/**
 * Procura o ícone com o nome especificado nos diretórios de dados.
 * @param name Nome do ícone (ex.: "whatsapp-desktop-cleyton.png")
 * @returns Objeto nativeImage criado a partir do caminho encontrado.
 */
export function findIcon(name: string) {
  let iconPath = fromDataDirs("icons/hicolor/512x512/apps/" + name);

  if (iconPath === null) {
    // Em producao (AppImage): extraFiles ficam na raiz do app (ao lado de resources/)
    if (app.isPackaged) {
      iconPath = path.join(process.resourcesPath, "..", "data/icons/hicolor/512x512/apps/", name);
    } else {
      iconPath = path.join(__dirname, "..", "data/icons/hicolor/512x512/apps/", name);
    }
  }

  return nativeImage.createFromPath(iconPath);
}

/**
 * Extrai o número de chats não lidos do título da janela.
 * @param title Título da janela.
 * @returns Número de chats não lidos.
 */
export function getUnreadMessages(title: string) {
  const matches = title.match(/\(\d+\) WhatsApp/);
  return matches == null ? 0 : Number.parseInt(matches[0].match(/\d+/)[0]);
}

/**
 * Procura o caminho do ícone nos diretórios especificados na variável de ambiente XDG_DATA_DIRS.
 * @param iconPath Caminho relativo do ícone.
 * @returns Caminho completo do ícone, se encontrado.
 */
function fromDataDirs(iconPath: string) {
  for (let dataDir of process.env.XDG_DATA_DIRS.split(":")) {
    let fullPath = path.join(dataDir, iconPath);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return null;
}

/**
 * Transforma um deep link no formato "whatsapp://send?phone=...&text=..." ou
 * "https://api.whatsapp.com/send?phone=...&text=..." em uma URL compatível com o WhatsApp Web.
 * Se a URL já estiver no formato "https://web.whatsapp.com/send?...", ela é retornada sem alteração.
 *
 * @param url Deep link original.
 * @returns URL transformada para o WhatsApp Web.
 */
export function transformDeepLink(url: string): string {
  try {
    const originalUrl = new URL(url);

    // Caso a URL seja do tipo "https://api.whatsapp.com/send"
    if (
      originalUrl.hostname === "api.whatsapp.com" &&
      originalUrl.pathname.startsWith("/send")
    ) {
      const phone = originalUrl.searchParams.get("phone");
      const text = originalUrl.searchParams.get("text");
      let newUrl = "https://web.whatsapp.com/send?";
      if (phone) {
        newUrl += "phone=" + encodeURIComponent(phone);
      }
      if (text) {
        newUrl += "&text=" + encodeURIComponent(text);
      }
      return newUrl;
    }

    // Se a URL usar o protocolo "whatsapp:"
    if (originalUrl.protocol === "whatsapp:") {
      const phone = originalUrl.searchParams.get("phone");
      const text = originalUrl.searchParams.get("text");
      let newUrl = "https://web.whatsapp.com/send?";
      if (phone) {
        newUrl += "phone=" + encodeURIComponent(phone);
      }
      if (text) {
        newUrl += "&text=" + encodeURIComponent(text);
      }
      return newUrl;
    }

    // Se a URL já estiver no formato do WhatsApp Web, retorna como está
    if (
      originalUrl.hostname === "web.whatsapp.com" &&
      originalUrl.pathname.startsWith("/send")
    ) {
      return url;
    }

    // Caso não se enquadre em nenhum dos casos, retorna a página padrão
    return "https://web.whatsapp.com/";
  } catch (e) {
    console.error("Erro ao transformar deep link:", e);
    return "https://web.whatsapp.com/";
  }
}

/**
 * Retorna a versão atual do aplicativo.
 * @returns Versão do aplicativo.
 */
export function getAppVersion() {
  return app.getVersion();
}
