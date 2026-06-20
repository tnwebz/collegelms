import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sender = process.env.EMAIL_SENDER;
const password = process.env.EMAIL_PASSWORD;

console.log(`📧 Testing Email Credentials...`);
console.log(`User: ${sender}`);
console.log(`Pass: ${password ? password.substring(0, 4) : ''}******** (Length: ${password ? password.length : 0})`);

const testEmail = async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: sender,
        pass: password,
      },
    });

    console.log("✅ Connected to Gmail Server");
    
    await transporter.verify();
    console.log("✅ Login Successful!");

    await transporter.sendMail({
      from: sender,
      to: sender,
      subject: "Test Email",
      text: "If you see this, the system is working.",
    });

    console.log("✅ Test Email Sent to yourself!");
  } catch (error: any) {
    console.log(`\n❌ FATAL ERROR: ${error.message}`);
  }
};

testEmail();
