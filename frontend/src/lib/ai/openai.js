import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', override: true });

let _openai = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
  }
  return _openai;
}

/**
 * Multi-model strategy (OpenAI only):
 * - LIGHT:  gpt-4o-mini
 * - MID:    gpt-4o-mini
 * - HEAVY:  gpt-4o
 */
export const MODEL = {
  LIGHT: 'light',
  MID: 'mid',
  HEAVY: 'heavy',
};

const OPENAI_MODELS = {
  light: 'gpt-4o-mini',
  mid: 'gpt-4o-mini',
  heavy: 'gpt-4o',
};

export async function chat(systemPrompt, userContent, options = {}) {
  const {
    model = MODEL.LIGHT,
    temperature = 0.3,
    maxTokens = 4500,
  } = options;

  const normalizedModel = MODEL[model] || model;
  const oaiModel = OPENAI_MODELS[normalizedModel] || 'gpt-4o-mini';

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing in environment variables');
  }

  try {
    console.log(`[AI] Calling OpenAI: ${oaiModel}...`);
    const openaiClient = getOpenAI();
    const response = await openaiClient.chat.completions.create({
      model: oaiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature,
      max_tokens: maxTokens,
    });
    console.log(`[AI] OpenAI (${oaiModel}) success.`);
    return response.choices[0].message.content;
  } catch (error) {
    console.error(`[AI] OpenAI (${oaiModel}) failed:`, error.message);
    if (error.status === 401) {
      console.error("[AI] INVALID OPENAI API KEY. Please check your .env.local file.");
    }
    throw error; // Re-throw to prevent silent fallback
  }
}

export async function generateEmbedding(text) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing in environment variables');
  }

  const openaiClient = getOpenAI();
  const response = await openaiClient.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.substring(0, 8000),
  });
  return response.data[0].embedding;
}
