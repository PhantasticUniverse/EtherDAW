/**
 * Export an EtherScore to WAV using NodePlayer
 * Usage: npx tsx scripts/export-wav.ts <input.etherscore.json> [output.wav]
 */

import { createNodePlayer } from '../src/node/player.js';

async function main() {
  const player = createNodePlayer();
  
  player.setCallbacks({
    onProgress: (msg) => console.log(msg),
    onError: (err) => console.error('Error:', err.message),
  });

  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage: npx tsx scripts/export-wav.ts <input.etherscore.json> [output.wav]');
    process.exit(1);
  }
  
  const outputFile = process.argv[3] || inputFile.replace('.etherscore.json', '.wav').replace('.json', '.wav');
  
  console.log(`Loading: ${inputFile}`);
  await player.loadFile(inputFile);
  
  console.log(`Exporting to: ${outputFile}`);
  await player.exportWav(outputFile);
  
  console.log('Done!');
  player.dispose();
}

main().catch(console.error);
