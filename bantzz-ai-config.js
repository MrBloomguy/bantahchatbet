// Persistent config for Bantzz AI agent (system prompt, LLM type, API key, enable/disable)
// This is a simple JSON file for demo; in production, use a database or secrets manager.

module.exports = {
  systemPrompt: 'You are Bantzz, the official AI agent for Bantah. Answer questions about Bantah, its features, rules, and community.',
  llmType: 'openai',
  llmApiKey: process.env.OPENAI_API_KEY || '',
  enabled: true
};
