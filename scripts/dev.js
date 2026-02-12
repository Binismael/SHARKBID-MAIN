#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set up environment variables
process.env.API_PORT = process.env.API_PORT || '5173';

console.log('🚀 Starting Fusion development servers...\n');

// Start Vite client server
const viteProcess = spawn('pnpm', ['run', 'dev:client'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env },
});

// Start Express API server
const expressProcess = spawn('pnpm', ['run', 'dev:server'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env },
});

// Handle process termination
const cleanup = () => {
  console.log('\n🛑 Shutting down development servers...');
  viteProcess.kill();
  expressProcess.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Handle process exits
viteProcess.on('exit', (code) => {
  console.log(`Vite process exited with code ${code}`);
  cleanup();
});

expressProcess.on('exit', (code) => {
  console.log(`Express process exited with code ${code}`);
  cleanup();
});
