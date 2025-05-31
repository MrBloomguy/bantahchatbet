// Simple Express.js backend for Bantzz AI agent (OpenAI example)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');

// Load persistent config
const config = require('./bantzz-ai-config');

const app = express();
const PORT = process.env.BANTZZ_AI_PORT || 5050;

app.use(cors());
app.use(bodyParser.json());

// Set your OpenAI API key in .env or here
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-...'; // Replace with your key
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Use config values for system prompt, LLM type, API key, and enable/disable
let SYSTEM_PROMPT = config.systemPrompt;
let LLM_TYPE = config.llmType;
let LLM_API_KEY = config.llmApiKey;
let AGENT_ENABLED = config.enabled;

// System prompt for Bantzz
const DEFAULT_SYSTEM_PROMPT = `You are Bantzz, the official AI agent for Bantah. Answer questions about Bantah, its features, rules, and community. If you don't know, say so honestly.`;
if (!SYSTEM_PROMPT) SYSTEM_PROMPT = DEFAULT_SYSTEM_PROMPT;

app.post('/api/bantzz', async (req, res) => {
  if (!AGENT_ENABLED) return res.status(503).json({ error: 'Bantzz AI agent is currently disabled.' });
  const { question, user } = req.body;
  if (!question) return res.status(400).json({ error: 'No question provided.' });

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question }
        ],
        max_tokens: 512,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${LLM_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const aiMessage = response.data.choices[0].message.content;
    res.json({ answer: aiMessage });
  } catch (err) {
    res.status(500).json({ error: 'AI backend error', details: err.message });
  }
});

// Get current config
app.get('/api/bantzz/config', (req, res) => {
  const { systemPrompt, llmType, enabled } = require('./bantzz-ai-config');
  res.json({ systemPrompt, llmType, enabled });
});

// Update config (admin only, no auth for demo)
app.post('/api/bantzz/config', (req, res) => {
  const { systemPrompt, llmType, llmApiKey, enabled } = req.body;
  const configPath = './bantzz-ai-config.js';
  // Update config file (simple overwrite for demo)
  const newConfig = `module.exports = {\n  systemPrompt: ${JSON.stringify(systemPrompt)},\n  llmType: ${JSON.stringify(llmType)},\n  llmApiKey: ${JSON.stringify(llmApiKey)},\n  enabled: ${enabled} \n};\n`;
  fs.writeFileSync(configPath, newConfig);
  // Update in-memory values
  SYSTEM_PROMPT = systemPrompt;
  LLM_TYPE = llmType;
  LLM_API_KEY = llmApiKey;
  AGENT_ENABLED = enabled;
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Bantzz AI backend running on port ${PORT}`);
});
