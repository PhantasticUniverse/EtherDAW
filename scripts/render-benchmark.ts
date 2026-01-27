import { NodePlayer } from '../src/node/player.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

async function main() {
  const inputFile = process.argv[2] || 'examples/benchmark-orchestral.etherscore.json';
  const outputFile = process.argv[3] || 'output/benchmark-orchestral.wav';
  
  console.log(`Rendering ${inputFile} to ${outputFile}...`);
  
  const player = new NodePlayer({
    onProgress: (msg) => console.log(msg),
    onComplete: () => console.log('Complete!'),
    onError: (err) => console.error('Error:', err),
  });

  await player.loadFile(inputFile);
  
  // Ensure output directory exists
  const outDir = path.dirname(outputFile);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  await player.exportWav(outputFile);
  console.log(`Exported to ${outputFile}`);
}

main().catch(console.error);
