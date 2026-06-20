import fs from 'fs';
import { google } from 'googleapis';
import readline from 'readline';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const getToken = async () => {
  if (!fs.existsSync('credentials.json')) {
    console.log("❌ Error: credentials.json not found! Please download it from Google Cloud.");
    process.exit(1);
  }

  console.log("🚀 Opening browser... Please login with the INSTRUCTOR'S Google Account.");
  const creds = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
  const { client_secret, client_id, redirect_uris } = creds.installed || creds.web;
  
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0] || 'urn:ietf:wg:oauth:2.0:oob');

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);
  
  rl.question('Enter the code from that page here: ', async (code) => {
    rl.close();
    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      fs.writeFileSync('token.json', JSON.stringify(tokens));
      console.log("✅ Success! 'token.json' has been created.");
      console.log("You can now run your backend.");
    } catch (err) {
      console.error('Error retrieving access token', err);
    }
  });
};

getToken();
