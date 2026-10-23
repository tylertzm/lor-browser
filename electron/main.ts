import { app, BrowserWindow, Menu, MenuItemConstructorOptions, ipcMain, shell, session } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';

let mainWindow: BrowserWindow | null = null;

function getActiveWindow(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0] || mainWindow;
}

// Process Separation, Sandboxing, and Hardware Acceleration Switches
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch('enable-features', 'NetworkService,HttpsFirstMode,PartitionedCookies');
app.commandLine.appendSwitch('site-per-process');
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');

const REAL_CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const FIREFOX_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0';

app.userAgentFallback = REAL_CHROME_UA;

function createPrivateWindow() {
  const privWindow = new BrowserWindow({
    title: 'Lor — Private',
    width: 1360,
    height: 880,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    ...(process.platform === 'darwin'
      ? {
          trafficLightPosition: { x: 16, y: 16 },
          vibrancy: 'under-window' as const,
          visualEffectState: 'active' as const
        }
      : {
          titleBarOverlay: {
            color: '#000000',
            symbolColor: '#ffffff',
            height: 36
          }
        }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    privWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}?private=1`);
  } else {
    privWindow.loadFile(path.join(__dirname, '../dist/index.html'), { query: { private: '1' } });
  }
}

function createApplicationMenu() {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Lor',
      submenu: [
        {
          label: 'About Lor',
          click: () => {
            getActiveWindow()?.webContents.send('trigger-shortcut', 'open-about');
          }
        },
        {
          label: 'Settings & Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            getActiveWindow()?.webContents.send('trigger-shortcut', 'open-settings');
          }
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            getActiveWindow()?.webContents.send('trigger-shortcut', 'new-tab');
          }
        },
        {
          label: 'New Incognito Window',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            createPrivateWindow();
          }
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            getActiveWindow()?.webContents.send('trigger-shortcut', 'close-tab');
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar Auto-Collapse',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            getActiveWindow()?.webContents.send('trigger-shortcut', 'toggle-sidebar');
          }
        },
        {
          label: 'Open / Focus Address Bar',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            getActiveWindow()?.webContents.send('trigger-shortcut', 'focus-address-bar');
          }
        },
        {
          label: 'Split Screen',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            getActiveWindow()?.webContents.send('trigger-shortcut', 'split-screen');
          }
        },
        {
          label: 'History Archive',
          accelerator: 'CmdOrCtrl+Y',
          click: () => {
            getActiveWindow()?.webContents.send('trigger-shortcut', 'open-history');
          }
        },
        {
          label: 'Downloads',
          accelerator: 'CmdOrCtrl+J',
          click: () => {
            getActiveWindow()?.webContents.send('trigger-shortcut', 'open-downloads');
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'History',
      submenu: [
        {
          label: 'Show Full History Archive',
          accelerator: 'CmdOrCtrl+Y',
          click: () => {
            getActiveWindow()?.webContents.send('trigger-shortcut', 'open-history');
          }
        },
        {
          label: 'History & Sync Settings...',
          click: () => {
            getActiveWindow()?.webContents.send('trigger-shortcut', 'open-settings-history');
          }
        },
        { type: 'separator' },
        {
          label: 'Back',
          accelerator: 'CmdOrCtrl+[',
          click: () => {
            getActiveWindow()?.webContents.send('trigger-shortcut', 'navigate-back');
          }
        },
        {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+]',
          click: () => {
            getActiveWindow()?.webContents.send('trigger-shortcut', 'navigate-forward');
          }
        },
        { type: 'separator' },
        {
          label: 'Clear Browsing Data...',
          click: () => {
            getActiveWindow()?.webContents.send('trigger-shortcut', 'open-settings-history');
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            getActiveWindow()?.webContents.send('trigger-shortcut', 'open-settings-shortcuts');
          }
        },
        {
          label: 'About Lor',
          click: () => {
            getActiveWindow()?.webContents.send('trigger-shortcut', 'open-about');
          }
        },
        {
          label: 'Connect with Tyler Tan on LinkedIn',
          click: () => {
            shell.openExternal('https://www.linkedin.com/in/tylertan0/');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Lor',
    width: 1360,
    height: 880,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    ...(process.platform === 'darwin'
      ? {
          trafficLightPosition: { x: 16, y: 16 },
          vibrancy: 'under-window' as const,
          visualEffectState: 'active' as const
        }
      : {
          titleBarOverlay: {
            color: '#000000',
            symbolColor: '#ffffff',
            height: 36
          }
        }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Download tracking across all webviews and sessions
const downloadsMap = new Map<string, any>();

function setupDownloads(sess: Electron.Session) {
  sess.on('will-download', (event, item) => {
    const id = `dl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const filename = item.getFilename();
    const totalBytes = item.getTotalBytes();
    const savePath = item.getSavePath();
    const url = item.getURL();
    const mimeType = item.getMimeType();

    const broadcastUpdate = (state: string) => {
      const data = {
        id,
        filename: item.getFilename() || filename,
        totalBytes: item.getTotalBytes() || totalBytes,
        receivedBytes: item.getReceivedBytes(),
        state,
        savePath: item.getSavePath() || savePath,
        url,
        mimeType,
        startTime: Date.now()
      };
      downloadsMap.set(id, data);
      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send('download-updated', data);
      });
    };

    broadcastUpdate('progressing');

    item.on('updated', (_, state) => {
      broadcastUpdate(state);
    });

    item.once('done', (_, state) => {
      broadcastUpdate(state);
    });
  });
}

ipcMain.on('open-external', (_, url: string) => {
  shell.openExternal(url);
});

ipcMain.on('toggle-fullscreen', () => {
  const focused = BrowserWindow.getFocusedWindow();
  if (focused) {
    focused.setFullScreen(!focused.isFullScreen());
  }
});

ipcMain.on('open-private-window', () => {
  createPrivateWindow();
});

ipcMain.handle('show-item-in-folder', async (_, filePath: string) => {
  if (filePath) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});

ipcMain.handle('open-path', async (_, filePath: string) => {
  if (filePath) {
    return await shell.openPath(filePath);
  }
  return '';
});

ipcMain.handle('get-downloads-dir', () => {
  return app.getPath('downloads');
});

ipcMain.handle('get-recent-downloads', async () => {
  const downloadsDir = app.getPath('downloads');
  try {
    const files = await fs.promises.readdir(downloadsDir);
    const fileStats = await Promise.all(
      files
        .filter((f) => !f.startsWith('.'))
        .map(async (f) => {
          try {
            const fullPath = path.join(downloadsDir, f);
            const stat = await fs.promises.stat(fullPath);
            return {
              id: `local-${stat.ino || f}`,
              filename: f,
              totalBytes: stat.size,
              receivedBytes: stat.size,
              state: 'completed' as const,
              savePath: fullPath,
              url: '',
              startTime: stat.mtimeMs,
              completedTime: stat.mtimeMs
            };
          } catch {
            return null;
          }
        })
    );
    return fileStats
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 30);
  } catch (err) {
    return [];
  }
});

// Direct integration with local Google Chrome History
ipcMain.handle('get-chrome-history', async (_, limit = 300) => {
  const homeDir = app.getPath('home');
  const possiblePaths = [
    path.join(homeDir, 'Library/Application Support/Google/Chrome/Default/History'),
    path.join(homeDir, 'Library/Application Support/Google/Chrome/Profile 1/History'),
    path.join(homeDir, 'Library/Application Support/Google/Chrome/Profile 2/History'),
    path.join(homeDir, 'Library/Application Support/Chromium/Default/History')
  ];

  let chromeHistoryPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      chromeHistoryPath = p;
      break;
    }
  }

  if (!chromeHistoryPath) {
    return [];
  }

  try {
    const tempCopy = path.join(app.getPath('temp'), `lor_chrome_history_${Date.now()}.db`);
    await fs.promises.copyFile(chromeHistoryPath, tempCopy);

    const query = `SELECT url, title, (last_visit_time/1000000 - 11644473600) * 1000 as timestamp FROM urls WHERE url NOT LIKE 'file://%' AND title != '' ORDER BY last_visit_time DESC LIMIT ${Math.min(limit, 500)};`;

    const stdout = await new Promise<string>((resolve, reject) => {
      execFile('sqlite3', ['-json', tempCopy, query], (err, out) => {
        fs.promises.unlink(tempCopy).catch(() => {});
        if (err) return reject(err);
        resolve(out);
      });
    });

    const parsed = JSON.parse(stdout || '[]');
    return parsed.map((item: any, idx: number) => ({
      id: `chrome-${item.timestamp || Date.now()}-${idx}`,
      url: item.url,
      title: item.title || item.url,
      timestamp: item.timestamp,
      favicon: `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(item.url)}&size=32`,
      spaceName: 'Google Chrome',
      source: 'chrome'
    }));
  } catch (err) {
    return [];
  }
});

// Live Google Omnibox Suggestion completions
ipcMain.handle('get-google-suggestions', async (_, query: string) => {
  if (!query || typeof query !== 'string' || query.trim().length === 0) return [];
  try {
    const res = await fetch(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query.trim())}`);
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return data[1].slice(0, 7);
    }
    return [];
  } catch {
    return [];
  }
});

app.whenReady().then(() => {
  createApplicationMenu();

  const stealthPreloadPath = path.join(__dirname, 'stealthPreload.js');
  const guestSession = session.fromPartition('persist:arco_main');

  // Apply stealth preload strictly to the guest session so main window remains clean
  guestSession.setUserAgent(REAL_CHROME_UA);
  guestSession.setPreloads([stealthPreloadPath]);
  setupDownloads(guestSession);
  setupDownloads(session.defaultSession);

  // Strict Ephemeral Permission Gatekeeper: prevent background device sensor hijacking
  guestSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const privilegedHardware = ['media', 'geolocation', 'notifications', 'midi', 'camera', 'microphone', 'display-capture'];
    if (privilegedHardware.includes(permission)) {
      callback(false);
    } else {
      callback(true);
    }
  });

  [session.defaultSession, guestSession].forEach((sess) => {
    sess.setUserAgent(REAL_CHROME_UA);
    sess.webRequest.onBeforeSendHeaders((details, callback) => {
      const headers = details.requestHeaders;
      const isGoogleAuth = details.url.includes('accounts.google.com') ||
                           details.url.includes('accounts.youtube.com') ||
                           details.url.includes('oauth2.googleapis.com') ||
                           (details.url.includes('google.com') && (details.url.includes('/signin') || details.url.includes('/ServiceLogin')));

      if (isGoogleAuth) {
        // Bypass Google's embedded-Chromium BotGuard check using native Firefox identity
        headers['User-Agent'] = FIREFOX_UA;
        delete headers['sec-ch-ua'];
        delete headers['sec-ch-ua-mobile'];
        delete headers['sec-ch-ua-platform'];
        delete headers['sec-ch-ua-platform-version'];
        delete headers['sec-ch-ua-full-version-list'];
      } else {
        headers['User-Agent'] = REAL_CHROME_UA;
        headers['sec-ch-ua'] = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"';
        headers['sec-ch-ua-mobile'] = '?0';
        headers['sec-ch-ua-platform'] = '"macOS"';
      }
      callback({ cancel: false, requestHeaders: headers });
    });
  });

  // Intercept guest webview creation and forward shortcuts even when clicked inside webpage
  app.on('web-contents-created', (_, contents) => {
    if (contents.getType() === 'webview') {
      contents.setUserAgent(REAL_CHROME_UA);

      // Support native OAuth and login popups with shared session partition
      contents.setWindowOpenHandler((details) => {
        const isAuthPopup = details.url.includes('accounts.google.com') ||
                            details.url.includes('github.com/login') ||
                            details.url.includes('appleid.apple.com') ||
                            details.url.includes('facebook.com/v') ||
                            details.url.includes('/oauth') ||
                            details.url.includes('/auth') ||
                            details.url.includes('signin') ||
                            details.url.includes('login');

        if (isAuthPopup) {
          return {
            action: 'allow',
            overrideBrowserWindowOptions: {
              width: 520,
              height: 680,
              autoHideMenuBar: true,
              titleBarStyle: 'default',
              backgroundColor: '#121214',
              webPreferences: {
                partition: 'persist:arco_main',
                contextIsolation: true,
                nodeIntegration: false
              }
            }
          };
        }

        const targetWin = getActiveWindow();
        targetWin?.webContents.send('open-popup-as-tab', details.url);
        return { action: 'deny' };
      });

      contents.on('before-input-event', (event, input) => {
        if ((input.meta || input.control) && input.type === 'keyDown') {
          const k = input.key.toLowerCase();
          const targetWin = getActiveWindow();

          if (input.shift && k === 'n') {
            event.preventDefault();
            createPrivateWindow();
          } else if (k === 't') {
            event.preventDefault();
            targetWin?.webContents.send('trigger-shortcut', 'new-tab');
          } else if (k === 'l') {
            event.preventDefault();
            targetWin?.webContents.send('trigger-shortcut', 'focus-address-bar');
          } else if (k === 'w') {
            event.preventDefault();
            targetWin?.webContents.send('trigger-shortcut', 'close-tab');
          } else if (k === 's') {
            event.preventDefault();
            targetWin?.webContents.send('trigger-shortcut', 'split-screen');
          } else if (k === 'y' || k === 'h') {
            event.preventDefault();
            targetWin?.webContents.send('trigger-shortcut', 'open-history');
          } else if (k === 'j') {
            event.preventDefault();
            targetWin?.webContents.send('trigger-shortcut', 'open-downloads');
          }
        }
      });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
