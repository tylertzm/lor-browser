// Stealth Preload Script for Guest WebViews
// Bypasses Cloudflare Turnstile, Google BotGuard, and modern anti-bot WAFs

const stealthCode = `
(function () {
  'use strict';

  // 1. Eradicate navigator.webdriver & Automation Flags
  try {
    const navProto = Object.getPrototypeOf(navigator) || Navigator.prototype;
    delete navigator.webdriver;
    delete navProto.webdriver;
    Object.defineProperty(navProto, 'webdriver', {
      get: () => undefined,
      configurable: true,
      enumerable: false
    });
    // Remove CDP automation markers
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
  } catch (e) {}

  // Google Accounts / Auth Specialized Identity (Bypasses embedded-Chromium BotGuard heuristics)
  try {
    const host = window.location.hostname || '';
    const path = window.location.pathname || '';
    const isGoogleAuth = host.includes('accounts.google.com') ||
                         host.includes('accounts.youtube.com') ||
                         (host.includes('google.com') && (path.includes('/signin') || path.includes('/ServiceLogin')));

    if (isGoogleAuth) {
      const navProto = Object.getPrototypeOf(navigator) || Navigator.prototype;
      const FIREFOX_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0';
      Object.defineProperty(navProto, 'userAgent', {
        get: () => FIREFOX_UA,
        configurable: true
      });
      Object.defineProperty(navProto, 'appVersion', {
        get: () => '5.0 (Macintosh)',
        configurable: true
      });
      Object.defineProperty(navProto, 'platform', {
        get: () => 'MacIntel',
        configurable: true
      });
      delete navProto.userAgentData;
      delete navigator.userAgentData;
    }
  } catch (e) {}

  // 2. Realistic Chrome navigator.plugins and mimeTypes
  try {
    const mockPlugins = [
      {
        name: 'PDF Viewer',
        filename: 'internal-pdf-viewer',
        description: 'Portable Document Format',
        mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' }]
      },
      {
        name: 'Chrome PDF Viewer',
        filename: 'internal-pdf-viewer',
        description: 'Portable Document Format',
        mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' }]
      },
      {
        name: 'Chromium PDF Viewer',
        filename: 'internal-pdf-viewer',
        description: 'Portable Document Format',
        mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' }]
      },
      {
        name: 'Microsoft Edge PDF Viewer',
        filename: 'internal-pdf-viewer',
        description: 'Portable Document Format',
        mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' }]
      },
      {
        name: 'WebKit built-in PDF',
        filename: 'internal-pdf-viewer',
        description: 'Portable Document Format',
        mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' }]
      }
    ];

    const fakePlugins = [];
    const fakeMimeTypes = [];

    mockPlugins.forEach((p, idx) => {
      const pluginObj = {
        name: p.name,
        filename: p.filename,
        description: p.description,
        length: p.mimeTypes.length,
        item: (i) => pluginObj[i],
        namedItem: (name) => (name === p.name ? pluginObj : null),
        [Symbol.iterator]: function* () {
          for (let m = 0; m < p.mimeTypes.length; m++) {
            yield pluginObj[m];
          }
        }
      };

      p.mimeTypes.forEach((m, mIdx) => {
        const mimeObj = {
          type: m.type,
          suffixes: m.suffixes,
          description: m.description,
          enabledPlugin: pluginObj
        };
        pluginObj[mIdx] = mimeObj;
        pluginObj[m.type] = mimeObj;
        fakeMimeTypes.push(mimeObj);
        fakeMimeTypes[m.type] = mimeObj;
      });

      fakePlugins[idx] = pluginObj;
      fakePlugins[p.name] = pluginObj;
    });

    fakePlugins.length = mockPlugins.length;
    fakePlugins.item = (i) => fakePlugins[i];
    fakePlugins.namedItem = (name) => fakePlugins[name] || null;
    fakePlugins.refresh = () => {};
    fakePlugins[Symbol.iterator] = function* () {
      for (let i = 0; i < mockPlugins.length; i++) {
        yield fakePlugins[i];
      }
    };

    fakeMimeTypes.item = (i) => fakeMimeTypes[i];
    fakeMimeTypes.namedItem = (name) => fakeMimeTypes[name] || null;
    fakeMimeTypes[Symbol.iterator] = function* () {
      for (let i = 0; i < fakeMimeTypes.length; i++) {
        yield fakeMimeTypes[i];
      }
    };

    const navProto = Object.getPrototypeOf(navigator) || Navigator.prototype;

    Object.defineProperty(navProto, 'plugins', {
      get: () => fakePlugins,
      configurable: true,
      enumerable: true
    });

    Object.defineProperty(navProto, 'mimeTypes', {
      get: () => fakeMimeTypes,
      configurable: true,
      enumerable: true
    });
  } catch (e) {}

  // 3. Realistic navigator.languages
  try {
    const navProto = Object.getPrototypeOf(navigator) || Navigator.prototype;
    const sysLangs = (navigator.languages && navigator.languages.length > 0) 
      ? Array.from(navigator.languages) 
      : ['en-US', 'en'];
    Object.defineProperty(navProto, 'languages', {
      get: () => sysLangs,
      configurable: true,
      enumerable: true
    });
  } catch (e) {}

  // 4. Client Hints (navigator.userAgentData) matching standard Google Chrome
  try {
    const brands = [
      { brand: 'Google Chrome', version: '131' },
      { brand: 'Chromium', version: '131' },
      { brand: 'Not_A Brand', version: '24' }
    ];

    const fakeUserAgentData = {
      brands,
      mobile: false,
      platform: 'macOS',
      getHighEntropyValues: async (hints) => {
        const result = {
          brands,
          mobile: false,
          platform: 'macOS'
        };
        if (hints.includes('architecture')) result.architecture = 'arm';
        if (hints.includes('bitness')) result.bitness = '64';
        if (hints.includes('model')) result.model = '';
        if (hints.includes('platformVersion')) result.platformVersion = '15.0.0';
        if (hints.includes('uaFullVersion')) result.uaFullVersion = '131.0.6778.86';
        if (hints.includes('fullVersionList')) {
          result.fullVersionList = [
            { brand: 'Google Chrome', version: '131.0.6778.86' },
            { brand: 'Chromium', version: '131.0.6778.86' },
            { brand: 'Not_A Brand', version: '24.0.0.0' }
          ];
        }
        return result;
      },
      toJSON: () => ({
        brands,
        mobile: false,
        platform: 'macOS'
      })
    };

    const navProto = Object.getPrototypeOf(navigator) || Navigator.prototype;
    Object.defineProperty(navProto, 'userAgentData', {
      get: () => fakeUserAgentData,
      configurable: true,
      enumerable: true
    });
  } catch (e) {}

  // 5. Genuine window.chrome runtime object
  try {
    if (!window.chrome) {
      window.chrome = {};
    }
    const originalChrome = window.chrome || {};
    window.chrome = {
      ...originalChrome,
      app: {
        isInstalled: false,
        InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
        RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' },
        getDetails: () => null,
        getIsInstalled: () => false,
        runningState: () => 'cannot_run'
      },
      cs: {},
      loadTimes: function () {
        const now = Date.now() / 1000;
        return {
          commitLoadTime: now,
          connectionInfo: 'http/1.1',
          finishDocumentLoadTime: now,
          finishLoadTime: now,
          firstPaintAfterLoadTime: 0,
          firstPaintTime: now,
          navigationType: 'Other',
          npnNegotiatedProtocol: 'unknown',
          requestTime: now - 0.05,
          startLoadTime: now - 0.05,
          wasAlternateProtocolAvailable: false,
          wasFetchedViaSpdy: false,
          wasNpnNegotiated: false
        };
      },
      runtime: {
        OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install', SHARED_MODULE_UPDATE: 'shared_module_update', UPDATE: 'update' },
        OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' },
        PlatformArch: { ARM: 'arm', ARM64: 'arm64', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
        PlatformNaclArch: { ARM: 'arm', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
        PlatformOs: { ANDROID: 'android', CROS: 'cros', LINUX: 'linux', MAC: 'mac', OPENBSD: 'openbsd', WIN: 'win' },
        RequestUpdateCheckStatus: { NO_UPDATE: 'no_update', THROTTLED: 'throttled', UPDATE_AVAILABLE: 'update_available' },
        connect: function () {},
        sendMessage: function () {}
      }
    };
  } catch (e) {}

  // 6. Realistic WebGL Vendor & Renderer (Apple Silicon / Metal)
  try {
    const getParameterProto = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      if (parameter === 37445) {
        // UNMASKED_VENDOR_WEBGL
        return 'Google Inc. (Apple)';
      }
      if (parameter === 37446) {
        // UNMASKED_RENDERER_WEBGL
        return 'ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)';
      }
      return getParameterProto.apply(this, [parameter]);
    };

    if (typeof WebGL2RenderingContext !== 'undefined') {
      const getParameter2Proto = WebGL2RenderingContext.prototype.getParameter;
      WebGL2RenderingContext.prototype.getParameter = function (parameter) {
        if (parameter === 37445) {
          return 'Google Inc. (Apple)';
        }
        if (parameter === 37446) {
          return 'ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)';
        }
        return getParameter2Proto.apply(this, [parameter]);
      };
    }
  } catch (e) {}

  // 7. Permissions API Prompt State
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const origQuery = navigator.permissions.query;
      navigator.permissions.query = function (param) {
        if (param && param.name === 'notifications') {
          return Promise.resolve({
            state: 'prompt',
            name: 'notifications',
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false
          });
        }
        return origQuery.apply(this, [param]);
      };
    }
  } catch (e) {}
})();
`;

// Execute anti-bot stealth scripts immediately in isolated world and World 0
try {
  const runFn = new Function(stealthCode);
  runFn();
} catch (e) {}

try {
  let webFrame: any = null;
  try {
    webFrame = require('electron').webFrame;
  } catch (err) {}

  if (webFrame && typeof webFrame.executeJavaScriptInIsolatedWorld === 'function') {
    webFrame.executeJavaScriptInIsolatedWorld(0, [{ code: stealthCode }]);
  }
} catch (e) {}

// ============================================================================
// Native Fluid Trackpad Horizontal Swipe Navigation (Back / Forward)
// ============================================================================
(function setupSwipeNavigation() {
  if (typeof window === 'undefined' || window !== window.top) return;

  let ipc: any = null;
  try {
    ipc = require('electron').ipcRenderer;
  } catch (e) {}

  let canGoBackState = Boolean(window.history && window.history.length > 1);
  let canGoForwardState = false;

  if (ipc && typeof ipc.on === 'function') {
    ipc.on('update-history-state', (_: any, state: any) => {
      if (state) {
        if (typeof state.canGoBack === 'boolean') canGoBackState = state.canGoBack;
        if (typeof state.canGoForward === 'boolean') canGoForwardState = state.canGoForward;
      }
    });
  }

  // Pre-create HUD elements for zero-latency 60fps tracking
  let hud: HTMLDivElement | null = null;
  let arrowBack: SVGElement | null = null;
  let arrowFwd: SVGElement | null = null;

  function getHud() {
    if (hud && document.body && hud.parentNode) return hud;
    if (!document.body && !document.documentElement) return null;

    hud = document.getElementById('__lor_swipe_hud') as HTMLDivElement;
    if (!hud) {
      hud = document.createElement('div');
      hud.id = '__lor_swipe_hud';
      hud.style.cssText = [
        'position: fixed',
        'width: 44px',
        'height: 44px',
        'border-radius: 50%',
        'background: rgba(18, 18, 22, 0.94)',
        'backdrop-filter: blur(28px)',
        '-webkit-backdrop-filter: blur(28px)',
        'border: 1px solid rgba(255, 255, 255, 0.22)',
        'box-shadow: 0 8px 32px rgba(0, 0, 0, 0.75)',
        'display: flex',
        'align-items: center',
        'justify-content: center',
        'color: #ffffff',
        'z-index: 2147483647',
        'pointer-events: none',
        'opacity: 0',
        'will-change: transform, opacity',
        'top: 50%',
        'left: 0',
        'transform: translate3d(-52px, -50%, 0)'
      ].join(';');

      hud.innerHTML = 
        '<svg id="__lor_arrow_back" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="m15 18-6-6 6-6"/></svg>' +
        '<svg id="__lor_arrow_fwd" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="m9 18 6-6-6-6"/></svg>';

      (document.body || document.documentElement).appendChild(hud);
    }

    arrowBack = document.getElementById('__lor_arrow_back') as any;
    arrowFwd = document.getElementById('__lor_arrow_fwd') as any;
    return hud;
  }

  let accumulatedDeltaX = 0;
  let gestureTimer: any = null;
  let hasTriggeredInGesture = false;
  let currentCursorY = typeof window !== 'undefined' ? window.innerHeight / 2 : 300;
  const THRESHOLD = 38; // Fast, decisive confirmation threshold

  window.addEventListener('mousemove', (e) => {
    currentCursorY = Math.max(60, Math.min(window.innerHeight - 60, e.clientY));
    if (e.clientX <= 14) {
      try {
        if (ipc && typeof ipc.sendToHost === 'function') {
          ipc.sendToHost('edge-hover-left');
        }
      } catch {}
    }
  }, { passive: true });

  window.addEventListener('wheel', (e) => {
    // If this gesture already triggered a navigation, wait until fingers lift
    if (hasTriggeredInGesture) {
      if (gestureTimer) clearTimeout(gestureTimer);
      gestureTimer = setTimeout(() => {
        hasTriggeredInGesture = false;
        accumulatedDeltaX = 0;
      }, 160);
      return;
    }

    // Must be predominantly horizontal gesture
    if (Math.abs(e.deltaX) < 3 || Math.abs(e.deltaY) > Math.abs(e.deltaX) * 0.9) {
      return;
    }

    // If user is scrolled horizontally within an internal scrollable container, don't hijack scroll
    const targetEl = e.target as HTMLElement;
    if (targetEl && targetEl.scrollWidth > targetEl.clientWidth) {
      if (e.deltaX < 0 && targetEl.scrollLeft > 10) return;
      if (e.deltaX > 0 && targetEl.scrollLeft < targetEl.scrollWidth - targetEl.clientWidth - 10) return;
    }

    accumulatedDeltaX += e.deltaX;
    const isBack = accumulatedDeltaX < 0;
    const dragDist = Math.abs(accumulatedDeltaX);
    const progress = Math.min(1, dragDist / THRESHOLD);

    const el = getHud();
    if (el && arrowBack && arrowFwd) {
      el.style.transition = 'none';
      el.style.opacity = String(0.35 + progress * 0.65);
      el.style.top = currentCursorY + 'px';

      if (isBack) {
        arrowBack.style.display = 'block';
        arrowFwd.style.display = 'none';
        el.style.left = '0px';
        el.style.right = 'auto';
        const tx = -48 + progress * 62; // Slide in from -48px to +14px
        el.style.transform = `translate3d(${tx}px, -50%, 0)`;
      } else {
        arrowBack.style.display = 'none';
        arrowFwd.style.display = 'block';
        el.style.left = 'auto';
        el.style.right = '0px';
        const tx = 48 - progress * 62; // Slide in from +48px to -14px
        el.style.transform = `translate3d(${tx}px, -50%, 0)`;
      }
    }

    if (gestureTimer) clearTimeout(gestureTimer);
    gestureTimer = setTimeout(() => {
      if (el) {
        el.style.transition = 'opacity 0.16s ease, transform 0.16s ease';
        el.style.opacity = '0';
        el.style.transform = isBack ? 'translate3d(-48px, -50%, 0)' : 'translate3d(48px, -50%, 0)';
      }
      accumulatedDeltaX = 0;
      hasTriggeredInGesture = false;
    }, 160);

    // Confirmation switch: execute immediately once dragged past threshold (NO COOLDOWNS)
    if (dragDist >= THRESHOLD) {
      hasTriggeredInGesture = true;
      accumulatedDeltaX = 0;
      if (gestureTimer) clearTimeout(gestureTimer);

      if (el) {
        el.style.transition = 'opacity 0.16s ease, transform 0.16s ease';
        el.style.opacity = '0';
        el.style.transform = isBack ? 'translate3d(-48px, -50%, 0)' : 'translate3d(48px, -50%, 0)';
      }

      // Notify host webview to perform navigation
      if (ipc && typeof ipc.sendToHost === 'function') {
        ipc.sendToHost(isBack ? 'navigate-back' : 'navigate-forward');
      }

      // Also trigger browser history fallback
      try {
        if (isBack) {
          window.history.back();
        } else {
          window.history.forward();
        }
      } catch (err) {}
    }
  }, { passive: true });
})();
