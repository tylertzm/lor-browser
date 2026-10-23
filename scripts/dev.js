const { createServer } = require('vite');
const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');

async function startDev() {
  // 1. Compile Electron main & preload
  const { execSync } = require('child_process');
  console.log('⚡ Compiling Electron scripts...');
  execSync('npx tsc -p tsconfig.electron.json', { stdio: 'inherit' });

  // 2. Start Vite Dev Server
  console.log('⚡ Starting Vite dev server...');
  const server = await createServer({
    configFile: path.resolve(__dirname, '../vite.config.ts'),
    server: { port: 5173 }
  });
  await server.listen();

  const devUrl = 'http://localhost:5173';
  console.log(`🌐 Vite dev server running at: ${devUrl}`);

  // 3. Launch Electron
  console.log('🚀 Launching Electron...');
  const child = spawn(electron, ['.'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      VITE_DEV_SERVER_URL: devUrl
    }
  });

  child.on('close', () => {
    server.close();
    process.exit();
  });
}

startDev().catch((err) => {
  console.error(err);
  process.exit(1);
});
