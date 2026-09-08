import { networkInterfaces } from 'node:os';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const privateIpv4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

function findLanAddress() {
  const candidates = [];

  for (const [interfaceName, addresses] of Object.entries(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family !== 'IPv4' || address.internal || !privateIpv4.test(address.address)) {
        continue;
      }

      const preferredInterface = /wi-?fi|wlan|wireless/i.test(interfaceName);
      candidates.push({ address: address.address, preferredInterface });
    }
  }

  candidates.sort((left, right) => Number(right.preferredInterface) - Number(left.preferredInterface));
  return candidates[0]?.address;
}

const lanAddress = findLanAddress();

if (!lanAddress) {
  console.error('Could not find a private Wi-Fi/LAN IPv4 address. Connect the laptop to Wi-Fi and try again.');
  process.exit(1);
}

const apiOrigin = `http://${lanAddress}:3000`;
console.log(`Mobile API: ${apiOrigin}`);

if (process.argv.includes('--print-only')) {
  process.exit(0);
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const expoCli = join(scriptDirectory, '..', 'node_modules', 'expo', 'bin', 'cli');
const expoArguments = process.argv.slice(2).filter((argument) => argument !== '--print-only');
const hasConnectionMode = expoArguments.some((argument) =>
  ['--lan', '--localhost', '--tunnel'].includes(argument),
);

const child = spawn(
  process.execPath,
  [expoCli, 'start', ...(hasConnectionMode ? [] : ['--lan']), ...expoArguments],
  {
  cwd: join(scriptDirectory, '..'),
  env: {
    ...process.env,
    EXPO_PUBLIC_API_URL: apiOrigin,
  },
  stdio: 'inherit',
  },
);

child.on('error', (error) => {
  console.error(`Could not start Expo: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
