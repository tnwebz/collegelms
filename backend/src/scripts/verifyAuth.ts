import fs from 'fs';
import { google } from 'googleapis';

const testGoogleAuth = async () => {
  console.log("🔍 Checking 'token.json'...");

  if (!fs.existsSync('token.json')) {
    console.log("❌ Error: 'token.json' file not found.");
    return;
  }

  try {
    const creds = JSON.parse(fs.readFileSync('token.json', 'utf8'));
    
    // Attempting to use the googleauth library approach
    const auth = google.auth.fromJSON(creds) as any;
    const service = google.drive({ version: 'v3', auth });

    console.log("🚀 Testing connection to Google Drive...");
    
    const results = await service.files.list({
      pageSize: 1,
      fields: "files(id, name)"
    });
    const items = results.data.files || [];

    console.log("\n🎉 SUCCESS! Connected to Google Drive.");
    if (items.length === 0) {
      console.log("   (Your Drive folder is accessible, but currently empty or restricted).");
    } else {
      console.log(`   Found file: ${items[0].name} (ID: ${items[0].id})`);
    }

  } catch (error: any) {
    console.log(`\n❌ AUTHENTICATION FAILED: ${error.message}`);
    if (error.message.includes('invalid_grant')) {
        console.log("💡 Solution: Delete 'token.json' and run 'npx ts-node src/scripts/setupLocalAuth.ts' again.");
    }
  }
};

if (require.main === module) {
  testGoogleAuth();
}
