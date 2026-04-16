import { BrowserWindow, ipcMain, screen } from "electron";
import path from "path";

let miniPlayerWindow: BrowserWindow | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Inicializa o mini-player que escuta eventos de audio das janelas do WhatsApp.
 */
export function initMiniPlayer() {
  ipcMain.on("audio-state", (_event, state) => {
    if (state.playing) {
      showMiniPlayer(state);
    } else {
      scheduleMiniPlayerHide();
    }
  });
}

function showMiniPlayer(state: {
  playing: boolean;
  currentTime: number;
  duration: number;
}) {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  if (!miniPlayerWindow || miniPlayerWindow.isDestroyed()) {
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.workAreaSize;

    miniPlayerWindow = new BrowserWindow({
      width: 280,
      height: 60,
      x: width - 300,
      y: height - 80,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      transparent: true,
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
      },
    });

    miniPlayerWindow.setMenu(null);

    const html = getMiniPlayerHtml();
    miniPlayerWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    );

    miniPlayerWindow.on("closed", () => {
      miniPlayerWindow = null;
    });
  }

  // Atualiza o estado do player
  miniPlayerWindow.webContents.executeJavaScript(`
    if (window.updatePlayer) {
      window.updatePlayer(${state.currentTime}, ${state.duration});
    }
  `);
}

function scheduleMiniPlayerHide() {
  if (hideTimeout) return;
  hideTimeout = setTimeout(() => {
    if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
      miniPlayerWindow.close();
      miniPlayerWindow = null;
    }
    hideTimeout = null;
  }, 3000);
}

function getMiniPlayerHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, sans-serif;
    background: rgba(17, 27, 33, 0.92);
    border-radius: 10px;
    padding: 10px 16px;
    color: #e9edef;
    -webkit-app-region: drag;
    overflow: hidden;
  }
  .player { display: flex; align-items: center; gap: 10px; }
  .icon { font-size: 18px; }
  .info { flex: 1; }
  .label { font-size: 11px; color: #8696a0; }
  .progress-bar {
    width: 100%; height: 3px; background: #2a3942;
    border-radius: 2px; margin-top: 4px; overflow: hidden;
  }
  .progress-fill { height: 100%; background: #00a884; border-radius: 2px; transition: width 0.8s linear; }
  .time { font-size: 11px; color: #8696a0; white-space: nowrap; }
</style>
</head>
<body>
<div class="player">
  <span class="icon">\uD83C\uDFB5</span>
  <div class="info">
    <div class="label">Reproduzindo audio</div>
    <div class="progress-bar"><div class="progress-fill" id="progress"></div></div>
  </div>
  <span class="time" id="time">0:00</span>
</div>
<script>
  const progress = document.getElementById('progress');
  const timeEl = document.getElementById('time');
  window.updatePlayer = function(current, duration) {
    const pct = duration > 0 ? (current / duration) * 100 : 0;
    progress.style.width = pct + '%';
    const remaining = Math.max(0, Math.floor(duration - current));
    const min = Math.floor(remaining / 60);
    const sec = String(remaining % 60).padStart(2, '0');
    timeEl.textContent = '-' + min + ':' + sec;
  };
</script>
</body>
</html>`;
}
