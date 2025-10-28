const fs = require('fs');
const path = require('path');

// Read package.json version
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Read app.json
const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Update app.json version
appJson.expo.version = version;

// Update Android versionCode (increment for each release)
const versionParts = version.split('.').map(Number);
const versionCode = versionParts[0] * 10000 + versionParts[1] * 100 + versionParts[2];
appJson.expo.android.versionCode = versionCode;

// Update iOS buildNumber
appJson.expo.ios.buildNumber = versionCode.toString();

// Write back to app.json
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

console.log(`✅ Version synchronized to ${version}`);
console.log(`   Android versionCode: ${versionCode}`);
console.log(`   iOS buildNumber: ${versionCode}`);