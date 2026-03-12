const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Send a prompt to OpenAI and get a response.
 * Uses gpt-3.5-turbo by default for cost optimization.
 */
async function chat(systemPrompt, userContent, options = {}) {
  const {
    model = 'gpt-3.5-turbo',
    temperature = 0.3,
    maxTokens = 1500,
    jsonMode = false,
  } = options;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];

  const params = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    params.response_format = { type: 'json_object' };
  }

  const response = await openai.chat.completions.create(params);
  return response.choices[0].message.content;
}

/**
 * Generate embeddings for text using OpenAI.
 */
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text.substring(0, 8000), // Limit input length
  });

  return response.data[0].embedding;
}

module.exports = { chat, generateEmbedding, openai };
