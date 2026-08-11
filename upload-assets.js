/**
 * Upload large assets to R2 bucket
 * Run with: node upload-assets.js
 */

import { execSync } from 'child_process';
import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';

const ASSETS_DIR = 'assets/models';
const BUCKET_NAME = 'exoplanet-pioneer-assets';

async function getFiles(dir, fileList = []) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stats = await stat(filePath);
    
    if (stats.isDirectory()) {
      await getFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

async function uploadFile(filePath) {
  const relativePath = relative(ASSETS_DIR, filePath).replace(/\\/g, '/');
  const objectPath = `${BUCKET_NAME}/models/${relativePath}`;
  
  try {
    console.log(`Uploading: models/${relativePath}`);
    execSync(`wrangler r2 object put "${objectPath}" --file="${filePath}" --remote`, {
      stdio: 'inherit'
    });
    console.log(`✅ Uploaded: models/${relativePath}`);
  } catch (error) {
    console.error(`❌ Failed to upload: models/${relativePath}`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting asset upload to R2...\n');
  
  const files = await getFiles(ASSETS_DIR);
  const glbFiles = files.filter(f => f.endsWith('.glb'));
  
  console.log(`Found ${glbFiles.length} .glb files to upload\n`);
  
  for (const file of glbFiles) {
    await uploadFile(file);
  }
  
  console.log('\n✅ Upload complete!');
  console.log(`\nAssets will be available at: https://exoplanet-assets.starisdons.workers.dev/`);
}

main().catch(console.error);
