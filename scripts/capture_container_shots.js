const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  // Permanently bypass onboarding
  await page.addInitScript(() => {
    localStorage.setItem('lor_onboarding_v2_completed', 'true');
    localStorage.setItem('lor_onboarding_completed', 'true');
    localStorage.setItem('arco_spaces', JSON.stringify([
      { id: 'space-work', name: 'Engineering', icon: 'Cpu', color: '#10b981' },
      { id: 'space-research', name: 'Research', icon: 'Sparkles', color: '#a855f7' }
    ]));
  });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1200);

  // Open LorFlow
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('lor-open-workflow-canvas'));
  });
  await page.waitForSelector('.lor-workflow-overlay-container', { timeout: 4000 });
  await page.waitForTimeout(800);

  // Click Maximize to show the full glorious node graph
  await page.evaluate(() => {
    const maxBtn = document.querySelector('button[title*="Expand LorFlow"]') || document.querySelector('.lor-toolbar-icon-btn');
    // Or add maximized class directly
    const container = document.querySelector('.lor-workflow-overlay-container');
    if (container) container.classList.add('maximized');
  });
  await page.waitForTimeout(600);

  const container = await page.locator('.lor-workflow-overlay-container');

  // Shot 1: The full glorious LorFlow Autonomous Studio
  await container.screenshot({ path: '/Users/tyler/.gemini/antigravity/brain/f2a1f690-28b8-4ee8-8458-0165d6714b65/real_lorflow_studio.png' });
  console.log('Captured real_lorflow_studio.png!');

  // Shot 2: Click on the Lor AI Agent node to open node details inspector
  await page.evaluate(() => {
    const nodes = document.querySelectorAll('.lor-node-squircle');
    // Node 3 is Lor AI Agent
    if (nodes.length > 3) {
      nodes[3].click();
    }
  });
  await page.waitForSelector('.lor-workflow-inspector-panel', { timeout: 3000 });
  await page.waitForTimeout(600);

  await container.screenshot({ path: '/Users/tyler/.gemini/antigravity/brain/f2a1f690-28b8-4ee8-8458-0165d6714b65/real_lorflow_canvas.png' });
  console.log('Captured real_lorflow_canvas.png!');

  await browser.close();
})();
