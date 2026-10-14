import fs from 'node:fs';
import path from 'node:path';

// Expo export sizes are NOT APK/IPA download or installed sizes.
const directories = process.argv.slice(2);
if (!directories.length) throw new Error('Pass one or more Expo export directories.');
for (const directory of directories) {
  const metadata = JSON.parse(fs.readFileSync(path.join(directory, 'metadata.json'), 'utf8'));
  const result = {};
  for (const [platform, files] of Object.entries(metadata.fileMetadata)) {
    const assets = [...new Set(files.assets.map((asset) => asset.path))];
    const assetBytes = assets.reduce((total, asset) => total + fs.statSync(path.join(directory, asset)).size, 0);
    const bundleBytes = fs.statSync(path.join(directory, files.bundle)).size;
    result[platform] = { assetCount: assets.length, assetBytes, bundleBytes, totalBytes: assetBytes + bundleBytes };
  }
  console.log(JSON.stringify({ directory, platforms: result }, null, 2));
}
