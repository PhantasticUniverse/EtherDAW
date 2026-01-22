/**
 * Generate manifest.json from examples/ directory
 *
 * This script scans the examples/ directory for .etherscore.json files
 * and generates a manifest with metadata for the browser player.
 *
 * Run with: npx tsx scripts/generate-manifest.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

interface CompositionMeta {
  path: string;
  title: string;
  composer?: string;
  genre?: string;
  tempo?: number;
  key?: string;
  duration?: string;
  description?: string;
  tags?: string[];
}

interface Manifest {
  generated: string;
  version: string;
  compositions: CompositionMeta[];
}

/**
 * Calculate duration from EtherScore
 */
function calculateDuration(score: {
  settings: { tempo: number; timeSignature?: string };
  sections: Record<string, { bars: number; tempo?: number }>;
  arrangement: string[];
}): string {
  const beatsPerBar = 4; // Assume 4/4
  let totalSeconds = 0;

  for (const sectionName of score.arrangement) {
    const section = score.sections[sectionName];
    if (!section) continue;

    const tempo = section.tempo ?? score.settings.tempo;
    const bars = section.bars;
    const beats = bars * beatsPerBar;
    const seconds = (beats / tempo) * 60;
    totalSeconds += seconds;
  }

  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Main function
 */
async function main() {
  const examplesDir = path.join(ROOT_DIR, 'examples');
  const distDir = path.join(ROOT_DIR, 'dist');
  const outputPath = path.join(distDir, 'manifest.json');

  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Find all .etherscore.json files
  const files = fs.readdirSync(examplesDir)
    .filter(f => f.endsWith('.etherscore.json'))
    .sort();

  console.log(`Found ${files.length} compositions in examples/`);

  const compositions: CompositionMeta[] = [];

  for (const file of files) {
    const filePath = path.join(examplesDir, file);
    const relativePath = `examples/${file}`;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const score = JSON.parse(content);

      const meta: CompositionMeta = {
        path: relativePath,
        title: score.meta?.title ?? file.replace('.etherscore.json', ''),
        composer: score.meta?.composer,
        genre: score.meta?.genre,
        tempo: score.settings?.tempo,
        key: score.settings?.key,
        duration: calculateDuration(score),
        description: score.meta?.description,
        tags: score.meta?.tags,
      };

      // Clean up undefined values
      Object.keys(meta).forEach(key => {
        if (meta[key as keyof CompositionMeta] === undefined) {
          delete meta[key as keyof CompositionMeta];
        }
      });

      compositions.push(meta);
      console.log(`  + ${meta.title} (${meta.duration})`);
    } catch (error) {
      console.error(`  ! Error reading ${file}:`, error);
    }
  }

  // Sort by title
  compositions.sort((a, b) => a.title.localeCompare(b.title));

  // Read version from package.json
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8')
  );

  const manifest: Manifest = {
    generated: new Date().toISOString(),
    version: packageJson.version,
    compositions,
  };

  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  console.log(`\nGenerated manifest with ${compositions.length} compositions`);
  console.log(`Output: ${outputPath}`);
}

main().catch(console.error);
