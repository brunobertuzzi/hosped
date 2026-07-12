import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';
import * as path from 'path';

let serverProcess: ChildProcess | null = null;
let startedByUser = false;

jest.setTimeout(60000);

beforeAll(async () => {
  try {
    const res = await axios.get('http://localhost:3001/health', {
      timeout: 1000,
    });
    if (res.status === 200) {
      console.log(
        'NestJS server is already running on port 3001. Skipping spawn.',
      );
      return;
    }
  } catch (err) {
    // Server is not running, we need to start it
  }

  console.log('Starting NestJS server...');
  startedByUser = true;

  const backendDir = path.join(__dirname, '..');

  // Use node dist/src/main.js since build is completed before running e2e tests
  serverProcess = spawn('node', ['dist/src/main.js'], {
    cwd: backendDir,
    shell: true,
    stdio: 'ignore', // Keep test output clean
    env: { ...process.env, PORT: '3001' },
  });

  // Wait for server to start
  const startTime = Date.now();
  const timeout = 20000; // 20s
  let isUp = false;

  while (Date.now() - startTime < timeout) {
    try {
      const res = await axios.get('http://localhost:3001/health', {
        timeout: 1000,
      });
      if (res.status === 200) {
        isUp = true;
        break;
      }
    } catch (e) {
      // Ignore connection errors and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (!isUp) {
    console.error('NestJS server failed to start within timeout');
    if (serverProcess) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', serverProcess.pid!.toString(), '/f', '/t'], {
          shell: true,
        });
      } else {
        serverProcess.kill('SIGKILL');
      }
    }
    throw new Error('NestJS server failed to start');
  }
  console.log('NestJS server is up and running.');
}, 25000);

afterAll(async () => {
  if (startedByUser && serverProcess) {
    console.log('Stopping NestJS server...');
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', serverProcess.pid!.toString(), '/f', '/t'], {
        shell: true,
      });
    } else {
      serverProcess.kill('SIGTERM');
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
});
