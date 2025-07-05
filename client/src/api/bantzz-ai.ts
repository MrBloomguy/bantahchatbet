// Simple Express.js backend for Bantzz AI agent (OpenAI example)
// import express from 'express';
// import cors from 'cors';
// import bodyParser from 'body-parser';
// import axios from 'axios';

// Add API helpers for Bantzz admin config
export async function getBantzzConfig() {
  const res = await fetch('/api/bantzz/config');
  if (!res.ok) throw new Error('Failed to fetch config');
  return res.json();
}

export async function updateBantzzConfig({ systemPrompt, llmType, llmApiKey, enabled }: { systemPrompt: string, llmType: string, llmApiKey: string, enabled: boolean }) {
  const res = await fetch('/api/bantzz/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, llmType, llmApiKey, enabled })
  });
  if (!res.ok) throw new Error('Failed to update config');
  return res.json();
}

// const app = express();
// const PORT = process.env.PORT || 5050;

// app.use(cors());
// app.use(bodyParser.json());

// // Set your OpenAI API key in .env or here
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-...'; // Replace with your key
// const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// // System prompt for Bantzz
// const SYSTEM_PROMPT = `You are Bantzz, the official AI agent for Bantah. Answer questions about Bantah, its features, rules, and community. If you don't know, say so honestly.`;

// app.post('/api/bantzz', async (req, res) => {
//   const { question, user } = req.body;
//   if (!question) return res.status(400).json({ error: 'No question provided.' });

//   try {
//     const response = await axios.post(
//       OPENAI_API_URL,
//       {
//         model: 'gpt-3.5-turbo',
//         messages: [
//           { role: 'system', content: SYSTEM_PROMPT },
//           { role: 'user', content: question }
//         ],
//         max_tokens: 512,
//         temperature: 0.7
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${OPENAI_API_KEY}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );
//     const aiMessage = response.data.choices[0].message.content;
//     res.json({ answer: aiMessage });
//   } catch (err) {
//     res.status(500).json({ error: 'AI backend error', details: err.message });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Bantzz AI backend running on port ${PORT}`);
// });
