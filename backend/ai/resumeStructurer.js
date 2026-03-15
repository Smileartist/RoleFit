const { chat } = require('./openai');

const SYSTEM_PROMPT = `You are an expert resume parsing assistant. Your goal is to extract every piece of information from the resume text with 100% accuracy.
You MUST preserve all links (LinkedIn, GitHub, Portfolio), specific details like CGPA, and exact spacing/bullet point counts. 
The output MUST be STRICTLY valid JSON.`;

const USER_PROMPT_TEMPLATE = `Convert the following resume text into a highly detailed structured JSON.

Required fields:
- name (string)
- email (string)
- phone (string)
- location (string)
- linkedin (string - extract full URL/link if present)
- github (string - extract full URL/link if present)
- portfolio (string - extract full URL/link if present)
- summary (string)
- skills (array of strings)
- experience (array of objects with: title, company, duration, bullets)
- projects (array of objects with: name, techStack, description, bullets, url, github)
- education (array of objects with: degree, institution, year, details)
- certifications (array of strings)

STRICT GUIDELINES:
1. SPACING & DETAILS: Extract bullet points exactly as they are. Do not merge, summarize, or split them.
2. LINKS: Explicitly look for GitHub, LinkedIn, and Portfolio links in the header, footer, or project descriptions.
3. EDUCATION: Always include CGPA, GPA, or specializations in the 'details' field if they appear in the text.
4. ORDER: Maintain the chronological or original order of all entries.
5. NO HALLUCINATION: Only extract what is present in the text. If a field is missing, use null or an empty array.

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
