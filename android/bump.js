// Bumps the Android version before a release.
//   npm run bump            -> versionCode + 1, minor version + 1 (4.0.0 -> 4.1.0)
//   npm run bump -- 5.0.0   -> versionCode + 1, versionName = 5.0.0
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'twa-manifest.json');
const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));

let versionName = process.argv[2];
if (!versionName) {
  const [major, minor] = manifest.appVersionName.split('.').map(Number);
  versionName = `${major}.${minor + 1}.0`;
}

manifest.appVersionCode += 1;
manifest.appVersionName = versionName;
manifest.appVersion = versionName;

fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Android version -> ${versionName} (versionCode ${manifest.appVersionCode})`);
