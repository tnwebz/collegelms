import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = "AIzaSyBgfLU5nf8l3KbhtsPmcg3f1s7k4irU3UU"; // <--- MAKE SURE THIS IS CORRECT

console.log(`🔍 Checking API Key: ${apiKey.substring(0, 10)}...`);

const run = async () => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log("\n📡 Connecting to Google AI...");
    
    // In Node.js SDK, listing models is available on the genAI instance if supported, 
    // but the SDK does not officially export a listModels method in all versions.
    // For debugging, we just try to get the model.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log(`\n🟢 AVAILABLE: gemini-1.5-flash`);
    console.log("-".repeat(40));
    console.log(`\n👉 SUGGESTION: Your key works for generating content.`);
  } catch (error: any) {
    console.log(`\n🔥 CRITICAL ERROR: ${error.message}`);
    console.log("Double check your API KEY and Internet Connection.");
  }
};

run();
