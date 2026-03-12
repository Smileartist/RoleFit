import { chat, MODEL } from './openai';
import { safeJsonParse } from './jsonParser';

export async function extractKeywords(jobDescription) {
  if (!jobDescription || jobDescription.trim().length < 20) throw new Error('Job description too short.');

  const system = `You are a job description analysis assistant. Return ONLY valid JSON.`;
  const user = `Analyze this job description and extract: job_title, company_name, required_skills, technologies, experience_keywords, soft_skills, experience_level (junior/mid/senior/lead), role_type (frontend/backend/fullstack/devops/data/design/other).

Job Description:
"""
${jobDescription.substring(0, 6000)}
"""`;

  // LIGHT model — cheap extraction task
  const response = await chat(system, user, { model: MODEL.LIGHT, temperature: 0.2 });
  const parsed = safeJsonParse(response, { job_title: null, company_name: null, required_skills: [], technologies: [], experience_keywords: [], soft_skills: [] });
  return parsed;
}
