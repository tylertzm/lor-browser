const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  const assetsDir = path.resolve(__dirname, '../docs/assets');
  const rootDocsDir = path.resolve(__dirname, '../../docs/assets');

  const saveShot = async (filename) => {
    const p1 = path.join(assetsDir, filename);
    const p2 = path.join(rootDocsDir, filename);
    await page.screenshot({ path: p1 });
    fs.copyFileSync(p1, p2);
    console.log(`Saved screenshot: ${filename} (${fs.statSync(p1).size} bytes)`);
  };

  // 1. Capture clean main browser workspace
  await saveShot('lor-main-ui.png');
  await saveShot('carousel-1-workspace.png');

  // 2. Open LorFlow Studio
  console.log('Dispatching lor-open-workflow-canvas...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('lor-open-workflow-canvas'));
  });

  await page.waitForSelector('.lor-workflow-overlay-container', { timeout: 4000 });
  await page.waitForTimeout(600);

  const nodesCount = await page.$$eval('.lor-node-squircle', els => els.length);
  console.log(`LorFlow Studio open with ${nodesCount} nodes!`);

  // Take screenshot of LorFlow Studio
  await saveShot('lorflow-studio.png');

  // 3. Click on a node to show node details in inspector
  console.log('Clicking node to show details inspector...');
  await page.evaluate(() => {
    const nodes = document.querySelectorAll('.lor-node-squircle');
    if (nodes.length > 1) {
      nodes[1].click();
    } else if (nodes.length > 0) {
      nodes[0].click();
    }
  });

  await page.waitForSelector('.lor-workflow-inspector-panel', { timeout: 3000 });
  await page.waitForTimeout(500);
  console.log('Node details inspector open!');
  await saveShot('lorflow-canvas.png');

  // 4. Close LorFlow
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // 5. Open Space Switcher
  console.log('Opening space switcher...');
  await page.evaluate(() => {
    const spaceBtn = document.querySelector('.space-switcher-btn') || document.querySelector('.space-pill') || document.querySelector('.sidebar-space-badge');
    if (spaceBtn) spaceBtn.click();
  });
  await page.waitForTimeout(400);
  await saveShot('spaces-preview.png');
  await page.keyboard.press('Escape');

  // 6. Open Settings Modal
  console.log('Opening settings modal...');
  await page.evaluate(() => {
    const btn = document.querySelector('button[title*="Settings"]') || document.querySelector('.sidebar-action-btn[title*="Settings"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await saveShot('carousel-4-settings.png');
  await page.keyboard.press('Escape');

  // 7. Open Prologue Onboarding Modal
  console.log('Opening prologue modal...');
  await page.evaluate(() => {
    localStorage.removeItem('lor_onboarding_v2_completed');
  });
  await page.reload();
  await page.waitForTimeout(1000);
  await saveShot('lor-onboarding.png');
  await saveShot('carousel-3-prologue.png');

  await browser.close();
  console.log('All authentic high-res screenshots captured successfully!');
})();
