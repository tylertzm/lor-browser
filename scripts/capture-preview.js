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
  await win.loadFile(indexPath);

  // Set onboarding to completed and set state
  await win.webContents.executeJavaScript(`
    localStorage.setItem('lor_onboarding_v2_completed', 'true');
    localStorage.setItem('arco_spaces', JSON.stringify(${JSON.stringify(demoSpaces)}));
    localStorage.setItem('arco_active_space', 'space-work');
    localStorage.setItem('arco_tabs', JSON.stringify(${JSON.stringify(demoTabs)}));
  `);

  await win.loadFile(indexPath);
  await new Promise(r => setTimeout(r, 2000));

  // Decorate webview-holder with an authentic, stunning liquid monochrome content pane
  await win.webContents.executeJavaScript(`
    const holder = document.querySelector('.webview-holder');
    if (holder) {
      const existingWebviews = holder.querySelectorAll('webview');
      existingWebviews.forEach(wv => wv.style.display = 'none');

      const card = document.createElement('div');
      card.style.cssText = \`
        position: absolute;
        inset: 0;
        margin: 8px 12px 12px 0;
        background: radial-gradient(circle at 50% 15%, #18181f 0%, #08080a 75%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 32px;
        color: #ffffff;
        text-align: center;
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
            <div style="font-size:11px; color:#71717a; line-height:1.4;">Two-finger gesture swipe between Personal, Work & Labs</div>
          </div>
          <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:10px; text-align:left;">
            <div style="font-size:18px; margin-bottom:6px;">✨</div>
            <div style="font-size:13px; font-weight:600; color:#fff; margin-bottom:4px;">Semantic Tidy</div>
            <div style="font-size:11px; color:#71717a; line-height:1.4;">One-click AI tab categorization & deduplication</div>
          </div>
          <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:10px; text-align:left;">
            <div style="font-size:18px; margin-bottom:6px;">👁️</div>
            <div style="font-size:13px; font-weight:600; color:#fff; margin-bottom:4px;">15% Edge Peek</div>
            <div style="font-size:11px; color:#71717a; line-height:1.4;">Hover left edge to slide open without screen clutter</div>
          </div>
        </div>
      \`;

      holder.appendChild(card);
    }
  `);

  await new Promise(r => setTimeout(r, 1000));

  const image = await win.webContents.capturePage();
  const buffer = image.toPNG();
  const mainOutPath = path.join(__dirname, '../docs/assets/lor-main-ui.png');
  fs.writeFileSync(mainOutPath, buffer);
  console.log('Saved main UI preview to', mainOutPath, 'size:', buffer.length);

  // Copy to banner.png as well
  fs.writeFileSync(path.join(__dirname, '../docs/assets/banner.png'), buffer);

  app.quit();
});
