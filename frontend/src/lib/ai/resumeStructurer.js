import { chat, MODEL } from './openai';
import { safeJsonParse } from './jsonParser';

export async function structureResume(rawText) {
  if (!rawText || rawText.trim().length < 20) throw new Error('Resume text is too short.');

  const system = `You are a professional resume parsing engine. Your goal is to extract every detail from the provided resume text into a highly accurate, structured JSON format. 

STRICT RULES:
1. Return ONLY a valid JSON object. Do not include markdown blocks or extra text.
2. Focus on high precision for the 'skills' and 'projects' arrays.
3. PROJECTS: Extract the EXACT name, subtitle, and URL if available. 
4. DO NOT summarize or truncate project details. Capture all achievement bullets exactly.
5. If a project has multiple features mentioned, list them in the 'features' array. 
6. Use the 'bullets' array for the actual achievement/detail lines.
7. If information is missing, use an empty string or empty array.`;

  const user = `Extract the resume data from the text below into JSON format.

{
  "name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "summary": "string",
  "skills": ["string"],
  "experience": [{"title": "string", "company": "string", "duration": "string", "bullets": ["string"]}],
  "projects": [{"name": "string", "techStack": ["string"], "description": "string", "bullets": ["string"], "url": "string", "features": ["string"]}],
  "education": [{"degree": "string", "institution": "string", "year": "string"}],
  "certifications": ["string"]
}

Resume Text:
"""
${rawText.substring(0, 8000)}
"""`;

  console.log('[AI STRUCT] Calling chat with HEAVY model (gpt-4o)...');
  const response = await chat(system, user, { model: MODEL.HEAVY, temperature: 0.1 });
  console.log('[AI STRUCT] Raw Response Length:', response?.length || 0);
  if (response?.length < 50) {
    console.log('[AI STRUCT] Raw Response Snippet:', response);
  }

  const parsed = safeJsonParse(response, { name: '', email: '', skills: [], experience: [], projects: [], education: [] });
  console.log('[AI STRUCT] Parsed Skills Count:', parsed?.skills?.length || 0);
  return parsed;
}
