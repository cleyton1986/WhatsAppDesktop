import { BrowserWindow, ipcMain, screen } from "electron";
import path from "path";
import type AccountWindow from "./account-window";

let notifWindow: BrowserWindow | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;
let messages: Array<{ title: string; body: string; accountId: string; accountEmoji: string }> = [];
let windowReady = false;
const MAX_MESSAGES = 20;

let _getAccountWindows: () => AccountWindow[] = () => [];

/**
 * Navega para uma conversa especifica no WhatsApp Web buscando pelo nome do contato.
 */
function navigateToConversation(aw: AccountWindow, contactName: string, textToSend?: string) {
  const safeContact = JSON.stringify(contactName);
  const safeText = textToSend ? JSON.stringify(textToSend) : "null";

  aw.window.webContents.executeJavaScript(`
    (function() {
      var contactName = ${safeContact};
      var textToSend = ${safeText};

      // Busca a conversa pelo nome do contato na lista de chats
      var spans = document.querySelectorAll('span[title]');
      var found = null;
      for (var i = 0; i < spans.length; i++) {
        if (spans[i].getAttribute('title') === contactName) {
          found = spans[i];
          break;
        }
      }

      if (found) {
        // Clica na conversa
        found.click();

        if (textToSend) {
          // Aguarda o campo de texto carregar e insere a resposta
          setTimeout(function() {
            var input = document.querySelector('[contenteditable="true"][data-tab="10"]') ||
                        document.querySelector('[contenteditable="true"][role="textbox"]') ||
                        document.querySelector('footer [contenteditable="true"]');
            if (input) {
              input.focus();
              document.execCommand('insertText', false, textToSend);
              setTimeout(function() {
                input.dispatchEvent(new KeyboardEvent('keydown', {
                  key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
                }));
              }, 200);
            }
          }, 500);
        }
      }
    })();
  `).catch(() => {});
}

/**
 * Inicializa o sistema de notificacoes customizadas.
 */
export function initNotificationWindow(
  getAccountWindows: () => AccountWindow[]
) {
  _getAccountWindows = getAccountWindows;

  // Responder - busca a conversa pelo nome do contato, abre e envia texto
  ipcMain.on("notif-reply", (_event, accountId: string, contactName: string, text: string) => {
    console.log("[NotifWindow] Reply:", accountId, contactName, text);
    const aws = getAccountWindows();
    const aw = aws.find((a) => a.account.id === accountId);
    if (aw && !aw.window.isDestroyed()) {
      aw.show();
      navigateToConversation(aw, contactName, text);
    }
    closeNotifWindow();
  });

  // Silenciar
  ipcMain.on("notif-silence", () => {
    closeNotifWindow();
  });

  // Hover control
  ipcMain.on("notif-hover", (_event, hovering: boolean) => {
    if (hovering) {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    } else {
      scheduleHide();
    }
  });

  // Clique na notificacao - busca a conversa pelo nome do contato
  ipcMain.on("notif-click", (_event, accountId: string, contactName: string) => {
    const aws = getAccountWindows();
    const aw = aws.find((a) => a.account.id === accountId);
    if (aw) {
      aw.show();
      if (contactName) {
        navigateToConversation(aw, contactName);
      }
    }
    closeNotifWindow();
  });
}

/**
 * Chamado diretamente pelo AccountWindow quando uma notificacao e interceptada.
 */
export function pushNotification(accountId: string, title: string, body: string, accountEmoji?: string) {
  console.log("[NotifWindow] pushNotification:", accountId, title, body);

  if (messages.length >= MAX_MESSAGES) {
    messages.shift();
  }
  messages.push({ title, body, accountId, accountEmoji: accountEmoji || "" });

  if (!notifWindow || notifWindow.isDestroyed()) {
    windowReady = false;
    createNotifWindow();
    notifWindow!.webContents.on("did-finish-load", () => {
      console.log("[NotifWindow] Janela carregada, renderizando", messages.length, "mensagens");
      windowReady = true;
      updateContent();
    });
  } else if (windowReady) {
    updateContent();
  }
  // Se a janela existe mas nao esta pronta, o did-finish-load vai renderizar

  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
  scheduleHide();
}

function scheduleHide() {
  if (hideTimeout) return;
  hideTimeout = setTimeout(() => {
    closeNotifWindow();
    hideTimeout = null;
  }, 8000);
}

function closeNotifWindow() {
  if (notifWindow && !notifWindow.isDestroyed()) {
    notifWindow.close();
    notifWindow = null;
  }
  messages = [];
  windowReady = false;
}

function createNotifWindow() {
  const display = screen.getPrimaryDisplay();
  const { width } = display.workAreaSize;

  notifWindow = new BrowserWindow({
    width: 400,
    height: 160,
    x: width - 420,
    y: 20,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, "preload-notif.js"),
      contextIsolation: true,
      sandbox: false,
    },
  });

  notifWindow.setMenu(null);
  notifWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(getNotifHtml())}`);

  notifWindow.on("closed", () => {
    notifWindow = null;
    messages = [];
  });
}

function updateContent() {
  if (!notifWindow || notifWindow.isDestroyed()) return;

  const msgJson = JSON.stringify(messages);
  notifWindow.webContents
    .executeJavaScript(`if(window.updateMessages)window.updateMessages(${msgJson});`)
    .catch(() => {});

  // Redimensiona baseado na quantidade de mensagens
  const baseHeight = 120;
  const perMsg = 48;
  const newHeight = Math.min(baseHeight + messages.length * perMsg, 600);
  const bounds = notifWindow.getBounds();
  notifWindow.setBounds({ ...bounds, height: newHeight });
}

function getNotifHtml(): string {
  return `<!DOCTYPE html>
<html><head><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    background:#1f2c33;
    border-radius:12px;
    color:#e9edef;
    overflow:hidden;
    display:flex;flex-direction:column;height:100vh;
  }
  .header{
    padding:12px 16px 8px;font-size:13px;font-weight:600;color:#00a884;
    display:flex;align-items:center;gap:8px;
  }
  .messages{flex:1;overflow-y:auto;padding:0 16px}
  .messages::-webkit-scrollbar{width:4px}
  .messages::-webkit-scrollbar-thumb{background:#374045;border-radius:2px}
  .msg{padding:8px 0;border-bottom:1px solid #2a3942;cursor:pointer}
  .msg:last-child{border-bottom:none}
  .msg:hover{background:rgba(255,255,255,0.03);margin:0 -16px;padding:8px 16px;border-radius:4px}
  .msg-title{font-size:13px;font-weight:600;margin-bottom:2px}
  .msg-body{font-size:12px;color:#8696a0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:340px}
  .actions{padding:10px 16px;display:flex;gap:8px;border-top:1px solid #2a3942}
  .btn{flex:1;padding:9px 0;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;text-align:center}
  .btn:hover{opacity:0.85}
  .btn-reply{background:#00a884;color:#fff}
  .btn-silence{background:#374045;color:#8696a0}
  .reply-row{padding:8px 16px 10px;display:none;gap:6px;border-top:1px solid #2a3942}
  .reply-row.active{display:flex}
  .reply-input{flex:1;padding:8px 12px;background:#111b21;border:1px solid #374045;border-radius:8px;color:#e9edef;font-size:13px;outline:none}
  .reply-input:focus{border-color:#00a884}
  .reply-input::placeholder{color:#667781}
  .btn-send{padding:8px 16px;background:#00a884;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer}
</style></head><body>
<div class="header"><span>&#128172;</span><span id="htxt">WhatsApp</span></div>
<div class="messages" id="msgs"></div>
<div class="actions" id="acts">
  <button class="btn btn-reply" id="btnR">Responder</button>
  <button class="btn btn-silence" id="btnS">Silenciar</button>
</div>
<div class="reply-row" id="rrow">
  <input class="reply-input" id="rinp" placeholder="Digite sua resposta..." />
  <button class="btn-send" id="rsnd">Enviar</button>
</div>
<script>
  var api=window.notifAPI;
  var msgsEl=document.getElementById('msgs');
  var htxt=document.getElementById('htxt');
  var acts=document.getElementById('acts');
  var rrow=document.getElementById('rrow');
  var rinp=document.getElementById('rinp');
  var lastAid='';
  var lastContact='';

  window.updateMessages=function(arr){
    if(!arr||!arr.length)return;
    var last=arr[arr.length-1];
    lastAid=last.accountId;
    lastContact=last.title;
    htxt.textContent='WhatsApp ('+arr.length+(arr.length===1?' mensagem':' mensagens')+')';
    msgsEl.innerHTML='';
    arr.forEach(function(m){
      var d=document.createElement('div');d.className='msg';
      var emoji=m.accountEmoji?m.accountEmoji+' ':'';
      d.innerHTML='<div class="msg-title">'+emoji+esc(m.title)+'</div><div class="msg-body">'+esc(m.body)+'</div>';
      d.onclick=function(){api.click(m.accountId,m.title)};
      msgsEl.appendChild(d);
    });
    msgsEl.scrollTop=msgsEl.scrollHeight;
  };

  document.body.onmouseenter=function(){api.hover(true)};
  document.body.onmouseleave=function(){api.hover(false)};

  document.getElementById('btnR').onclick=function(){
    acts.style.display='none';rrow.classList.add('active');rinp.focus();
  };
  document.getElementById('rsnd').onclick=doReply;
  rinp.onkeydown=function(e){if(e.key==='Enter')doReply()};
  function doReply(){
    var t=rinp.value.trim();if(!t||!lastAid)return;
    api.reply(lastAid,lastContact,t);
  }
  document.getElementById('btnS').onclick=function(){api.silence()};

  function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}
</script></body></html>`;
}
