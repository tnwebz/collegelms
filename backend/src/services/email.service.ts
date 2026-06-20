import axios from 'axios';
import { config } from '../config';

export const sendCredentialsEmail = async (toEmail: string, name: string, password?: string | null, subject?: string | null, body?: string | null) => {
  const { brevoApiKey, emailSender } = config;

  console.log(`🚀 [BREVO API] Preparing to send to: ${toEmail}`);

  if (!brevoApiKey || !emailSender) {
    console.error("❌ ERROR: BREVO_API_KEY or EMAIL_SENDER missing.");
    return;
  }

  const url = "https://api.brevo.com/v3/smtp/email";

  const finalSubject = subject || "Welcome to St. Joseph's College! Your Credentials";
  
  let htmlContent = "";
  if (!body) {
    htmlContent = `
    <html>
    <body>
        <h1>Welcome ${name}!</h1>
        <p>You have been admitted to St. Joseph's College.</p>
        <p><strong>User ID:</strong> ${toEmail}</p>
        <p><strong>Password:</strong> ${password}</p>
        <br/>
        <p>Happy Learning!</p>
    </body>
    </html>
    `;
  } else {
    htmlContent = `<p>${body}</p>`.replace(/\n/g, "<br>");
  }

  const payload = {
    sender: { name: "St. Joseph's Admin", email: emailSender },
    to: [{ email: toEmail, name }],
    subject: finalSubject,
    htmlContent
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json"
      },
      timeout: 10000
    });

    if (response.status === 201) {
      console.log(`✅ [BREVO API] SUCCESS: Email sent! ID: ${response.data?.messageId}`);
    } else {
      console.log(`❌ [BREVO API] FAILED: ${response.status} - ${JSON.stringify(response.data)}`);
      throw new Error(`API Error: ${JSON.stringify(response.data)}`);
    }
  } catch (error: any) {
    console.error(`❌ [BREVO API] NETWORK ERROR: ${error.message}`);
    throw error;
  }
};
