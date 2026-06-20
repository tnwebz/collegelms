import fs from 'fs';
import { google } from 'googleapis';

class TokenManager {
  tokenPath: string;
  intervalMs: number;
  intervalId: NodeJS.Timeout | null;

  constructor(tokenPath: string = 'token.json', intervalDays: number = 4) {
    this.tokenPath = tokenPath;
    this.intervalMs = intervalDays * 86400 * 1000;
    this.intervalId = null;
  }

  async refreshToken() {
    try {
      if (fs.existsSync(this.tokenPath)) {
        const creds = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'));
        console.log("[TokenManager] 🔄 Checking token status...");
        
        const { client_secret, client_id, redirect_uris } = creds.installed || creds.web || { client_secret: '', client_id: '', redirect_uris: [] };
        
        // Using googleapis to handle refresh
        // If it's a raw token.json we might need to recreate the OAuth2Client
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris ? redirect_uris[0] : '');
        oAuth2Client.setCredentials(creds);

        if (creds.refresh_token) {
          try {
            const { credentials } = await oAuth2Client.refreshAccessToken();
            fs.writeFileSync(this.tokenPath, JSON.stringify(credentials));
            console.log("[TokenManager] ✅ Token refreshed and saved successfully.");
            console.log(`[TokenManager] New expiry: ${new Date(credentials.expiry_date as number)}`);
          } catch (error: any) {
            console.log(`[TokenManager] ❌ Failed to refresh token: ${error.message}`);
          }
        } else {
          console.log("[TokenManager] ⚠️ No refresh token found. Cannot auto-refresh.");
        }
      } else {
        console.log(`[TokenManager] ⚠️ ${this.tokenPath} not found. Skipping refresh.`);
      }
    } catch (error: any) {
      console.log(`[TokenManager] ❌ Unexpected Error: ${error.message}`);
    }
  }

  start() {
    if (!this.intervalId) {
      this.refreshToken(); // Run once immediately
      this.intervalId = setInterval(() => {
        this.refreshToken();
      }, this.intervalMs);
      console.log("[TokenManager] 🟢 Background refresh service started.");
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export default TokenManager;
