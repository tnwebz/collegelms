import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 8000,
  dbUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.SECRET_KEY || 'fallback_secret_change_me_in_prod',
  jwtAlgorithm: process.env.ALGORITHM || 'HS256',
  jwtExpiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '60', 10),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpaySecret: process.env.RAZORPAY_KEY_SECRET,
  geminiApiKey: process.env.GEMINI_API_KEY,
  brevoApiKey: process.env.BREVO_API_KEY,
  emailSender: process.env.EMAIL_SENDER,
  awsLambdaUrl: process.env.AWS_LAMBDA_URL,
};
