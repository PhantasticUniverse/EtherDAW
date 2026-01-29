#!/usr/bin/env npx tsx
/**
 * Publish a new composition to the player
 *
 * Usage:
 *   npx tsx scripts/publish-composition.ts <file.etherscore.json> [--play]
 *
 * This script:
 * 1. Validates the EtherScore file
 * 2. Compiles it to verify it works
 * 3. Updates dist/manifest.json so it appears in the player dropdown
 * 4. Optionally opens the player with the composition selected (--play)
 */

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

function run(command: string, args: string[], silent = false): boolean {
  const result = spawnSync(command, args, {
    stdio: silent ? 'pipe' : 'inherit',
    shell: false
  });
  return result.status === 0;
}

const args = process.argv.slice(2);
const playFlag = args.includes('--play');
const file = args.find(arg => arg.endsWith('.etherscore.json'));

if (!file) {
  console.error('Usage: npx tsx scripts/publish-composition.ts <file.etherscore.json> [--play]');
  console.error('');
  console.error('Options:');
  console.error('  --play    Open the player after publishing');
  process.exit(1);
}

if (!fs.existsSync(file)) {
  console.error(`Error: File not found: ${file}`);
  process.exit(1);
}

const filename = path.basename(file);

console.log(`\n Publishing: ${filename}\n`);

// Step 1: Validate
console.log('1. Validating...');
if (!run('npx', ['tsx', 'src/cli.ts', 'validate', file])) {
  console.error('\n Validation failed. Fix errors and try again.');
  process.exit(1);
}

// Step 2: Compile
console.log('\n2. Compiling...');
if (!run('npx', ['tsx', 'src/cli.ts', 'compile', file])) {
  console.error('\n Compilation failed. Fix errors and try again.');
  process.exit(1);
}

// Step 3: Update manifest
console.log('\n3. Updating player manifest...');
if (!run('npm', ['run', 'build:manifest'], true)) {
  console.error('\n Manifest update failed.');
  process.exit(1);
}
console.log('   Manifest updated');

// Get title from the file
let title = filename.replace('.etherscore.json', '');
try {
  const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
  if (content.meta?.title) {
    title = content.meta.title;
  }
} catch (e) {
  // Use filename as fallback
}

console.log(`\n "${title}" is now available in the player!`);

// Step 4: Optionally open player
if (playFlag) {
  console.log('\n4. Opening player...');

  // Kill any existing server (ignore errors)
  run('pkill', ['-f', 'http.server 8080'], true);

  // Start server in background using spawn with detached
  const { spawn } = await import('child_process');
  const server = spawn('python3', ['-m', 'http.server', '8080'], {
    detached: true,
    stdio: 'ignore'
  });
  server.unref();

  // Wait a moment for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Open browser
  run('open', ['http://localhost:8080/player.html']);

  console.log('   Player opened. Select the composition from the dropdown.');
}

console.log('');
