const { chat } = require('./openai');

const SYSTEM_PROMPT = `You are a resume parsing assistant. Convert resume text into structured JSON.
Return ONLY valid JSON with no additional text or markdown.`;

const USER_PROMPT_TEMPLATE = `Convert the following resume text into structured JSON.

Required fields:
- name (string)
- email (string)
- phone (string)
- location (string)
- summary (string)
- skills (array of strings)
- experience (array of objects with: title, company, duration, bullets)
- projects (array of objects with: name, techStack, description, bullets)
- education (array of objects with: degree, institution, year)
- certifications (array of strings)

If a field is not found, use an empty string or empty array.

Resume text:
"""
{RESUME_TEXT}
"""`;

/**
 * Structure raw resume text into JSON using AI.
 */
async function structureResume(rawText) {
  if (!rawText || rawText.trim().length < 20) {
    throw new Error('Resume text is too short to parse.');
  }

  const userPrompt = USER_PROMPT_TEMPLATE.replace('{RESUME_TEXT}', rawText.substring(0, 6000));

  const response = await chat(SYSTEM_PROMPT, userPrompt, {
    jsonMode: true,
    maxTokens: 2000,
    temperature: 0.1,
  });

  try {
    return JSON.parse(response);
  } catch {
    throw new Error('Failed to parse AI response into JSON.');
  }
}

module.exports = { structureResume };
