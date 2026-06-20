import fs from 'fs';

if (!fs.existsSync('token.json')) {
  console.log("❌ Error: token.json not found in this folder.");
  console.log("   Run 'npm run generate-token' first to generate it.");
} else {
  const fileData = fs.readFileSync('token.json');
  const encoded = Buffer.from(fileData).toString('base64');
  
  console.log("\n✅ COPY THE STRING BELOW (Everything between the lines):\n");
  console.log("-".repeat(20));
  console.log(encoded);
  console.log("-".repeat(20));
  console.log("\n👉 Go to Render Dashboard -> Settings -> Environment Variables");
  console.log("👉 Add Key: GOOGLE_TOKEN_BASE64");
  console.log("👉 Paste the string above as the Value.");
}
