import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const sourceDir = path.join(PROJECT_ROOT, 'src', 'multilingual-system', 'sitemaps');
const distDir = path.join(PROJECT_ROOT, 'dist', 'sitemaps');

if (!fs.existsSync(sourceDir)) {
  console.log('⚠️  No sitemaps found in src/multilingual-system/sitemaps/');
  process.exit(0);
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(sourceDir, distDir);
console.log(`✅ Copied sitemaps from ${sourceDir} to ${distDir}`);
