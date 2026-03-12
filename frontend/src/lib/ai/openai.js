import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
let _openai = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
  }
  return _openai;
}

/**
 * Multi-model strategy:
 * - LIGHT:  gpt-4o-mini (fallback: gemini-2.5-flash-lite)
 * - MID:    gpt-4o-mini (fallback: gemini-2.5-flash-lite)
 * - HEAVY:  gpt-4o      (fallback: gemini-2.5-flash-lite)
 */
export const MODEL = {
  LIGHT: 'light',
  MID: 'mid',
  HEAVY: 'heavy',
  // legacy support
  'gemini-2.5-flash-lite': 'light',
};

const OPENAI_MODELS = {
  light: 'gpt-4o-mini',
  mid: 'gpt-4o-mini',
  heavy: 'gpt-4o',
};

const GEMINI_MODELS = {
  light: 'gemini-1.5-flash',
  mid: 'gemini-1.5-flash',
  heavy: 'gemini-1.5-pro',
};

export async function chat(systemPrompt, userContent, options = {}) {
  const {
    model = MODEL.LIGHT,
    temperature = 0.3,
    maxTokens = 4500,
  } = options;

  const normalizedModel = MODEL[model] || model;
  const oaiModel = OPENAI_MODELS[normalizedModel] || 'gpt-4o-mini';
  const gemModelStr = GEMINI_MODELS[normalizedModel] || 'gemini-2.5-flash-lite';

  if (process.env.OPENAI_API_KEY) {
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
      console.warn(`[AI] OpenAI (${oaiModel}) failed:`, error.message);
      if (error.status === 401) {
        console.error("[AI] INVALID OPENAI API KEY. Please check your .env.local file.");
      }
    }
  }

  // Fallback to Gemini
  try {
    console.log(`[AI] Calling Gemini Fallback: ${gemModelStr}...`);
    const genModel = genAI.getGenerativeModel({
      model: gemModelStr,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
      systemInstruction: systemPrompt,
    });

    const result = await genModel.generateContent(userContent);
    console.log(`[AI] Gemini (${gemModelStr}) success.`);
    return result.response.text();
  } catch (gemError) {
    console.error("[AI] Gemini fallback also failed:", gemError.message);
    throw gemError;
  }
}

export async function generateEmbedding(text) {
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000),
      });
      return response.data[0].embedding;
    } catch (error) {
      console.warn("OpenAI Embedding failed, falling back to Gemini:", error.message);
    }
  }

  // Fallback to Gemini
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text.substring(0, 8000));
  return result.embedding.values;
}
