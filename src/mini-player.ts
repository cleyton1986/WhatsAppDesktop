import { BrowserWindow, screen } from "electron";
import type AccountWindow from "./account-window";

let miniPlayerWindow: BrowserWindow | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;
let pollInterval: ReturnType<typeof setInterval> | null = null;
let wasPlaying = false;

/**
 * Inicializa o polling de audio em todas as janelas de conta.
 */
export function initMiniPlayer(getAccountWindows: () => AccountWindow[]) {
  pollInterval = setInterval(async () => {
    await pollAudioState(getAccountWindows());
  }, 1000);
}

async function pollAudioState(accountWindows: AccountWindow[]) {
  for (const aw of accountWindows) {
    if (aw.window.isDestroyed()) continue;
    try {
      const state = await aw.window.webContents.executeJavaScript(`
        (function() {
          try {
            var audios = document.querySelectorAll('audio');
            var result = null;
            for (var i = 0; i < audios.length; i++) {
              var a = audios[i];
              if (!a.paused && a.duration > 0 && !isNaN(a.duration)) {
                result = { playing: true, currentTime: a.currentTime || 0, duration: a.duration || 0 };
                break;
              }
            }
            return result || { playing: false, currentTime: 0, duration: 0 };
          } catch(e) {
            return { playing: false, currentTime: 0, duration: 0 };
          }
        })();
      `);

      if (state && state.playing) {
        wasPlaying = true;
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
        showMiniPlayer(state);
        return;
      }
    } catch {
      // ignora erros de janelas em carregamento
    }
  }

  // Nenhum audio tocando
  if (wasPlaying) {
    wasPlaying = false;
    if (!hideTimeout) {
      hideTimeout = setTimeout(() => {
        closeMiniPlayer();
        hideTimeout = null;
      }, 3000);
    }
  }
}

function showMiniPlayer(state: { currentTime: number; duration: number }) {
  if (!miniPlayerWindow || miniPlayerWindow.isDestroyed()) {
    createMiniPlayerWindow();
  }

  if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
    const ct = state.currentTime || 0;
    const dur = state.duration || 0;
    miniPlayerWindow.webContents
      .executeJavaScript(`if(window.updatePlayer)window.updatePlayer(${ct},${dur});`)
      .catch(() => {});
  }
}

function createMiniPlayerWindow() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  miniPlayerWindow = new BrowserWindow({
    width: 300,
    height: 70,
    x: width - 320,
    y: height - 90,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    focusable: false,
    hasShadow: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });

  miniPlayerWindow.setMenu(null);
  miniPlayerWindow.setIgnoreMouseEvents(true);

  const html = `<!DOCTYPE html>
<html><head><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    font-family:-apple-system,sans-serif;
    background:#1f2c33;
    border-radius:12px;
    padding:14px 18px;
    color:#e9edef;
    overflow:hidden;
  }
  .player{display:flex;align-items:center;gap:12px}
  .icon{font-size:20px}
  .info{flex:1}
  .label{font-size:12px;color:#8696a0;margin-bottom:6px}
  .bar{width:100%;height:4px;background:#374045;border-radius:2px;overflow:hidden}
  .fill{height:100%;background:#00a884;border-radius:2px;transition:width 0.9s linear;width:0%}
  .time{font-size:12px;color:#8696a0;font-variant-numeric:tabular-nums}
</style></head><body>
<div class="player">
  <span class="icon">&#127925;</span>
  <div class="info">
    <div class="label">Reproduzindo audio</div>
    <div class="bar"><div class="fill" id="p"></div></div>
  </div>
  <span class="time" id="t">0:00</span>
</div>
<script>
  var p=document.getElementById('p'),t=document.getElementById('t');
  window.updatePlayer=function(c,d){
    p.style.width=(d>0?(c/d)*100:0)+'%';
    var r=Math.max(0,Math.floor(d-c));
    t.textContent='-'+Math.floor(r/60)+':'+String(r%60).padStart(2,'0');
  };
</script></body></html>`;

  miniPlayerWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  miniPlayerWindow.on("closed", () => {
    miniPlayerWindow = null;
  });
}

function closeMiniPlayer() {
  if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
    miniPlayerWindow.close();
    miniPlayerWindow = null;
  }
}
