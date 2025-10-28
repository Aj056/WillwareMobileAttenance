#!/usr/bin/env node

console.log(`
🚀 WillwareTech Mobile App - Deployment Setup
=============================================

This script will help you get started with deploying your mobile app.

📋 Prerequisites:
1. Expo account (sign up at expo.dev)
2. EAS CLI installed globally
3. Android development environment (optional for APK building)

🛠️ Next Steps:

1. LOGIN TO EXPO:
   eas login

2. CONFIGURE PROJECT:
   eas build:configure

3. BUILD YOUR FIRST APK:
   npm run build:android:apk

4. SETUP UPDATES:
   npm run update:production

📖 For detailed instructions, see DEPLOYMENT_GUIDE.md

⚠️  Important Notes:
- Always test builds before distributing to employees
- Keep track of version numbers for proper update management
- Ensure all employees have Android 6.0+ for compatibility

🆘 Need Help?
Check the DEPLOYMENT_GUIDE.md for comprehensive step-by-step instructions.

`);

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Would you like to start the EAS configuration now? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\n🔧 Starting EAS configuration...\n');
    const { spawn } = require('child_process');
    const easConfig = spawn('eas', ['build:configure'], { stdio: 'inherit' });
    
    easConfig.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ EAS configuration completed successfully!');
        console.log('\n📖 Next steps:');
        console.log('1. Review the generated eas.json file');
        console.log('2. Run: npm run build:android:apk');
        console.log('3. Check DEPLOYMENT_GUIDE.md for distribution methods');
      } else {
        console.log('\n❌ EAS configuration failed. Please check the error messages above.');
        console.log('💡 Try running: eas login first, then run this script again.');
      }
      rl.close();
    });
  } else {
    console.log('\n📖 No problem! Check DEPLOYMENT_GUIDE.md when you\'re ready to deploy.');
    console.log('\n🚀 Quick start commands:');
    console.log('   eas login');
    console.log('   eas build:configure');
    console.log('   npm run build:android:apk');
    rl.close();
  }
});