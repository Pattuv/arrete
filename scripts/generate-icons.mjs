import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const svgContent = readFileSync(join(root, 'src/assets/icon.svg'), 'utf8');

mkdirSync(join(root, 'public/icons'), { recursive: true });

const sizes = [16, 48, 128];

const { default: sharp } = await import('sharp');

for (const size of sizes) {
  const outPath = join(root, `public/icons/icon${size}.png`);
  await sharp(Buffer.from(svgContent))
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✓ Generated icon${size}.png`);
}

console.log('Icons generated successfully.');
