const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    console.log('Connecting to real Lor app over CDP...');
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const contexts = browser.contexts();
    if (contexts.length === 0) {
      throw new Error('No contexts found in CDP');
    }

    const pages = contexts[0].pages();
    console.log(`Found ${pages.length} targets in Lor.`);

    // Find the main Lor page
    let lorPage = pages.find(p => p.url().includes('dist/index.html') || p.url().includes('localhost'));
    if (!lorPage) {
      lorPage = pages[0];
    }

    console.log('Using Lor window:', lorPage.url());

    // Ensure directory exists
    const assetsDir = path.resolve(__dirname, '../docs/assets');
    const rootDocsDir = path.resolve(__dirname, '../../docs/assets');
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.mkdirSync(rootDocsDir, { recursive: true });

    // Helper to save screenshot to both docs dirs
    const saveShot = async (filename) => {
      const p1 = path.join(assetsDir, filename);
      const p2 = path.join(rootDocsDir, filename);
      await lorPage.screenshot({ path: p1 });
      fs.copyFileSync(p1, p2);
      console.log(`Saved real screenshot: ${filename}`);
    };

    // 1. Capture Main Workspace
    await lorPage.waitForTimeout(1000);
    await saveShot('lor-main-ui.png');
    await saveShot('carousel-1-workspace.png');

    // 2. Open LorFlow Studio
    console.log('Triggering LorFlow studio...');
    await lorPage.evaluate(() => {
      // Find and click the half-moon trigger or dispatch key/event
      const trigger = document.querySelector('.lor-half-moon-trigger') || document.querySelector('.lor-bottom-workflow-trigger-zone');
      if (trigger) {
        trigger.click();
      }
    });

    await lorPage.waitForTimeout(1000);
    await saveShot('lorflow-studio.png');

    // 3. Select a node to show Inspector Details
    console.log('Selecting node to display inspector details...');
    await lorPage.evaluate(() => {
      const nodes = document.querySelectorAll('.lor-node-squircle');
      if (nodes.length > 0) {
        // Click the first or second node
        nodes[Math.min(1, nodes.length - 1)].click();
      }
    });

    await lorPage.waitForTimeout(600);
    await saveShot('lorflow-canvas.png');

    // 4. Close LorFlow to return to main workspace
    await lorPage.keyboard.press('Escape');
    await lorPage.waitForTimeout(400);

    // 5. Open Space Switcher or Tab Vault
    console.log('Capturing space switcher...');
    await lorPage.evaluate(() => {
      const spaceBtn = document.querySelector('.space-switcher-btn') || document.querySelector('.space-pill') || document.querySelector('.sidebar-space-badge');
      if (spaceBtn) spaceBtn.click();
    });
    await lorPage.waitForTimeout(500);
    await saveShot('spaces-preview.png');
    await lorPage.keyboard.press('Escape');

    // 6. Open Settings Modal
    console.log('Capturing settings modal...');
    await lorPage.evaluate(() => {
      const settingsBtn = document.querySelector('.sidebar-action-btn[title*="Settings"]') || document.querySelector('button[title*="Settings"]');
      if (settingsBtn) settingsBtn.click();
    });
    await lorPage.waitForTimeout(600);
    await saveShot('carousel-4-settings.png');
    await lorPage.keyboard.press('Escape');

    // 7. Open Onboarding Prologue Modal
    console.log('Capturing onboarding prologue modal...');
    await lorPage.evaluate(() => {
      localStorage.removeItem('lor_onboarding_v2_completed');
      window.dispatchEvent(new CustomEvent('lor-replay-onboarding'));
    });
    // Or reload or click replay
    await lorPage.keyboard.press('Meta+,');
    await lorPage.waitForTimeout(400);

    console.log('All real screenshots captured successfully from live Lor app!');
    await browser.close();
  } catch (err) {
    console.error('Error capturing real screenshots:', err);
    process.exit(1);
  }
})();
