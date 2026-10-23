const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('disable-site-isolation-trials');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: true,
    frame: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, '../dist-electron/preload.js'),
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const demoSpaces = [
    { id: 'space-personal', name: 'Personal', themeColor: '#ffffff' },
    { id: 'space-work', name: 'Work', themeColor: '#ffffff' },
    { id: 'space-labs', name: 'Labs', themeColor: '#ffffff' }
  ];

  const demoTabs = [
    {
      id: 'tab-gh',
      title: 'GitHub — tylertzm/lor-browser',
      url: 'https://github.com/tylertzm/lor-browser',
      favicon: 'https://github.githubassets.com/favicons/favicon.png',
      pinned: true,
      isLoading: false,
      canGoBack: true,
      canGoForward: false,
      spaceId: 'space-work'
    },
    {
      id: 'tab-linear',
      title: 'Linear — Sprint Backlog & Roadmaps',
      url: 'https://linear.app',
      favicon: 'https://linear.app/favicon.ico',
      pinned: true,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      spaceId: 'space-work'
    },
    {
      id: 'tab-arxiv',
      title: 'arXiv: Liquid State Deep Architecture',
      url: 'https://arxiv.org/abs/2401.0001',
      favicon: 'https://arxiv.org/favicon.ico',
      pinned: false,
      isLoading: false,
      canGoBack: true,
      canGoForward: false,
      spaceId: 'space-work'
    },
    {
      id: 'tab-claude',
      title: 'Claude AI — Thought Synthesis & Code',
      url: 'https://claude.ai',
      favicon: 'https://claude.ai/favicon.ico',
      pinned: false,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      spaceId: 'space-work'
    },
    {
      id: 'tab-rust',
      title: 'Rust & WebAssembly Performance Manual',
      url: 'https://rust-lang.org',
      favicon: 'https://www.rust-lang.org/static/images/favicon.svg',
      pinned: false,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      spaceId: 'space-work'
    }
  ];

  const indexPath = path.join(__dirname, '../dist/index.html');

  // --- CAPTURE 1: MAIN WORKSPACE ---
  await win.loadFile(indexPath);
  await win.webContents.executeJavaScript(`
    localStorage.setItem('lor_onboarding_v2_completed', 'true');
    localStorage.setItem('arco_spaces', JSON.stringify(${JSON.stringify(demoSpaces)}));
    localStorage.setItem('arco_active_space', 'space-work');
    localStorage.setItem('arco_tabs', JSON.stringify(${JSON.stringify(demoTabs)}));
  `);
  await win.loadFile(indexPath);
  await new Promise(r => setTimeout(r, 1800));

  await win.webContents.executeJavaScript(`
    const holder = document.querySelector('.webview-holder');
    if (holder) {
      holder.querySelectorAll('webview').forEach(w => w.style.display = 'none');
      const card = document.createElement('div');
      card.style.cssText = \`
        position: absolute; inset: 0; margin: 8px 12px 12px 0;
        background: radial-gradient(circle at 50% 15%, #18181f 0%, #08080a 75%);
        border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 48px 32px; color: #ffffff; text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 20px 60px rgba(0, 0, 0, 0.6);
        z-index: 100;
      \`;
      card.innerHTML = \`
        <div style="display:inline-flex; align-items:center; gap:8px; padding:6px 16px; border-radius:999px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); font-size:12px; color:#d4d4d8; margin-bottom:28px;">
          <span style="width:7px; height:7px; border-radius:50%; background:#22c55e; box-shadow:0 0 10px #22c55e;"></span>
          <span>github.com/tylertzm/lor-browser • v0.1.0 Beta</span>
        </div>
        <h1 style="font-size:46px; font-weight:800; letter-spacing:-0.035em; line-height:1.15; margin-bottom:18px; max-width:640px; background:linear-gradient(180deg, #ffffff 40%, #a1a1aa 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
          The Internet, Reclaimed.
        </h1>
        <p style="font-size:16px; line-height:1.6; color:#9ca3af; max-width:540px; margin-bottom:36px;">
          A minimalist desktop sanctuary combining isolated spaces, vertical tabs, semantic tidy, and a collapsible 15% edge peek sidebar.
        </p>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:14px; max-width:600px; width:100%;">
          <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:10px; text-align:left;">
            <div style="font-size:18px; margin-bottom:6px;">🪐</div>
            <div style="font-size:13px; font-weight:600; color:#fff; margin-bottom:4px;">Dynamic Spaces</div>
            <div style="font-size:11px; color:#71717a; line-height:1.4;">Gesture swipe between contexts</div>
          </div>
          <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:10px; text-align:left;">
            <div style="font-size:18px; margin-bottom:6px;">✨</div>
            <div style="font-size:13px; font-weight:600; color:#fff; margin-bottom:4px;">Semantic Tidy</div>
            <div style="font-size:11px; color:#71717a; line-height:1.4;">Auto tab categorization</div>
          </div>
          <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:10px; text-align:left;">
            <div style="font-size:18px; margin-bottom:6px;">👁️</div>
            <div style="font-size:13px; font-weight:600; color:#fff; margin-bottom:4px;">15% Edge Peek</div>
            <div style="font-size:11px; color:#71717a; line-height:1.4;">Hover to slide navigation open</div>
          </div>
        </div>
      \`;
      holder.appendChild(card);
    }
  `);
  await new Promise(r => setTimeout(r, 600));
  const img1 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(__dirname, '../docs/assets/carousel-1-workspace.png'), img1.toPNG());
  console.log('Saved carousel 1 (Workspace)');

  // --- CAPTURE 2: BICAMERAL SPLIT VIEW ---
  const splitTabs = [
    {
      id: 'tab-gh',
      title: 'GitHub — tylertzm/lor-browser',
      url: 'https://github.com/tylertzm/lor-browser',
      favicon: 'https://github.githubassets.com/favicons/favicon.png',
      pinned: true,
      splitWithTabId: 'tab-linear',
      isLoading: false,
      canGoBack: true,
      canGoForward: false,
      spaceId: 'space-work'
    },
    {
      id: 'tab-linear',
      title: 'Linear — Sprint Backlog & Roadmaps',
      url: 'https://linear.app',
      favicon: 'https://linear.app/favicon.ico',
      pinned: true,
      splitWithTabId: 'tab-gh',
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      spaceId: 'space-work'
    },
    ...demoTabs.slice(2)
  ];
  await win.webContents.executeJavaScript(`
    localStorage.setItem('arco_tabs', JSON.stringify(${JSON.stringify(splitTabs)}));
  `);
  await win.loadFile(indexPath);
  await new Promise(r => setTimeout(r, 1800));

  await win.webContents.executeJavaScript(`
    const holder = document.querySelector('.webview-holder');
    if (holder) {
      holder.querySelectorAll('webview').forEach(w => w.style.display = 'none');
      const splitWrap = document.createElement('div');
      splitWrap.style.cssText = \`
        position: absolute; inset: 0; margin: 8px 12px 12px 0;
        display: flex; gap: 8px; z-index: 100;
      \`;
      splitWrap.innerHTML = \`
        <div style="flex:1; background:#0b0b0e; border:1px solid rgba(255,255,255,0.1); border-radius:12px; display:flex; flex-direction:column; padding:28px 24px; color:#fff; font-family:-apple-system, sans-serif; box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
            <div style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600;">
              <span>📁</span> GitHub: lor-browser / main
            </div>
            <div style="font-size:11px; color:#a1a1aa; font-family:monospace;">src/App.tsx</div>
          </div>
          <div style="font-size:12px; font-family:monospace; color:#a1a1aa; line-height:1.7;">
            <span style="color:#71717a;">// Liquid Monochrome Navigation Engine</span><br>
            <span style="color:#60a5fa;">export const</span> <span style="color:#fbbf24;">LorBrowser</span> = () =&gt; {<br>
            &nbsp;&nbsp;<span style="color:#c084fc;">const</span> [space, setSpace] = useState(<span style="color:#34d399;">'work'</span>);<br>
            &nbsp;&nbsp;<span style="color:#c084fc;">const</span> isSplit = <span style="color:#60a5fa;">true</span>;<br>
            &nbsp;&nbsp;<span style="color:#f472b6;">return</span> &lt;<span style="color:#38bdf8;">SplitViewport</span> ratio={0.5} /&gt;;<br>
            };
          </div>
        </div>
        <div style="flex:1; background:#0b0b0e; border:1px solid rgba(255,255,255,0.1); border-radius:12px; display:flex; flex-direction:column; padding:28px 24px; color:#fff; font-family:-apple-system, sans-serif; box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
            <div style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600;">
              <span>⚡</span> Linear: Sprint 42 Backlog
            </div>
            <div style="font-size:11px; padding:2px 8px; border-radius:4px; background:rgba(34,197,94,0.15); color:#22c55e;">IN PROGRESS</div>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <div style="padding:10px 12px; border-radius:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); font-size:13px; display:flex; justify-content:space-between;">
              <span>LOR-108: Auto-collapse 15% hover peek</span>
              <span style="color:#a1a1aa; font-size:11px;">Tyler Tan</span>
            </div>
            <div style="padding:10px 12px; border-radius:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); font-size:13px; display:flex; justify-content:space-between;">
              <span>LOR-109: Windows NSIS x64 cross-packaging</span>
              <span style="color:#a1a1aa; font-size:11px;">Tyler Tan</span>
            </div>
            <div style="padding:10px 12px; border-radius:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); font-size:13px; display:flex; justify-content:space-between;">
              <span>LOR-110: Bicameral split-screen ratio resizer</span>
              <span style="color:#a1a1aa; font-size:11px;">Tyler Tan</span>
            </div>
          </div>
        </div>
      \`;
      holder.appendChild(splitWrap);
    }
  `);
  await new Promise(r => setTimeout(r, 600));
  const img2 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(__dirname, '../docs/assets/carousel-2-split.png'), img2.toPNG());
  console.log('Saved carousel 2 (Split View)');

  // --- CAPTURE 3: PROLOGUE SCREEN ---
  await win.webContents.executeJavaScript(`
    localStorage.removeItem('lor_onboarding_v2_completed');
  `);
  await win.loadFile(indexPath);
  await new Promise(r => setTimeout(r, 1600));
  const img3 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(__dirname, '../docs/assets/carousel-3-prologue.png'), img3.toPNG());
  console.log('Saved carousel 3 (Prologue)');

  // --- CAPTURE 4: SETTINGS & APPEARANCE ---
  await win.webContents.executeJavaScript(`
    localStorage.setItem('lor_onboarding_v2_completed', 'true');
  `);
  await win.loadFile(indexPath);
  await new Promise(r => setTimeout(r, 1500));
  await win.webContents.executeJavaScript(`
    const settingsBtn = document.querySelector('button[title*="Settings"], .dock-settings-btn, button[class*="settings"]');
    if (settingsBtn) settingsBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  const img4 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(__dirname, '../docs/assets/carousel-4-settings.png'), img4.toPNG());
  console.log('Saved carousel 4 (Settings)');

  app.quit();
});
