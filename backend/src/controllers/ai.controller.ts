import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

const genAI = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;

export const generateChallenge = async (req: Request, res: Response) => {
  const { title } = req.body;

  if (!config.geminiApiKey || !model) {
    return res.status(500).json({ detail: 'API Key missing' });
  }

  try {
    const prompt = `Create a programming challenge on "${title}". OUTPUT JSON ONLY: { "description": "...", "test_cases": [ {"input": "...", "output": "...", "hidden": false} ] }`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid JSON");
    
    const aiData = JSON.parse(match[0]);
    return res.json({
      description: aiData.description,
      test_cases: JSON.stringify(aiData.test_cases || [])
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ detail: `AI Error: ${error.message}` });
  }
};
