import { chat, MODEL } from './openai.js';
import { safeJsonParse } from './jsonParser.js';

export async function tailorResumeBullets(resumeBullets, jobSkills) {
  const bulletsText = Array.isArray(resumeBullets) ? resumeBullets.map((b, i) => `${i + 1}. ${b}`).join('\n') : resumeBullets;
  const skillsText = Array.isArray(jobSkills) ? jobSkills.join(', ') : jobSkills;

  const system = `You are a professional resume optimization assistant. Return ONLY valid JSON.`;
  const user = `Rewrite these resume bullets to match the job skills. Maintain truthfulness, use action verbs, focus on impact.

Job Skills: ${skillsText}

Current Bullets:
${bulletsText}

Return JSON: { "tailored_bullets": ["bullet1", "bullet2", ...] }`;

  // MID model — resume rewriting requires higher quality
  const response = await chat(system, user, { model: MODEL.MID, temperature: 0.4 });
  const parsed = safeJsonParse(response, { tailored_bullets: Array.isArray(resumeBullets) ? resumeBullets : [] });
  return parsed;
}

export async function tailorSkills(currentSkills, jobSkills) {
  const skillsText = Array.isArray(currentSkills) ? currentSkills.join(', ') : (currentSkills || '');
  const jobText = Array.isArray(jobSkills) ? jobSkills.join(', ') : (jobSkills || '');

  const system = `You are a professional resume optimization assistant. Return ONLY valid JSON.`;
  const user = `Reorganize and prioritize the candidate's technical skills to match the job requirements.
Keep all original skills, but put the ones most relevant to the job first. 

Job Skills: ${jobText}
Current Skills: ${skillsText}

Return JSON: { "tailored_skills": ["Skill 1", "Skill 2", ...] }`;

  const response = await chat(system, user, { model: MODEL.LIGHT, temperature: 0.3 });
  return safeJsonParse(response, { tailored_skills: Array.isArray(currentSkills) ? currentSkills : [] });
}

export async function tailorLatexTemplate(latexCode, jobDescription) {
  if (!latexCode || latexCode.trim().length < 50) return latexCode;

  const system = `You are an elite LaTeX assistant specialized in content tailoring. Your goal is to optimize a candidate's LaTeX resume code for a target job description.

CRITICAL RULES:
1. STRICT LAYOUT PRESERVATION: You MUST preserve every single formatting command, spacing command (e.g., \\vspace, \\setlist, \\itemsep), structural header coordinates, and styling macro exactly as provided. 
2. TAILOR CONTENT ONLY: Adjust only the bullet points inside \\begin{itemize} blocks and any summary description paragraph to match the keywords and skills in the job description.
3. PRESERVE STRUCTURE: Do NOT add, remove, or reorganize the order of projects, titles, or headers. Just optimize the text strings inside them.
4. AGGRESSIVE OPTIMIZATION: Rewrite and update text bullets aggressively to accurately match the required keywords and titles, avoiding duplicating original content verbatim.
5. Output ONLY the raw updated LaTeX code document. No code blocks, no descriptions, no markdown wrap.`;

  const user = `Target Job Description:
"""
${jobDescription.substring(0, 3000)}
"""

Target LaTeX Code with User's Exact Layout and spacing commands:
"""
${latexCode}
"""`;

  const response = await chat(system, user, { model: MODEL.HEAVY, temperature: 0.4 });
  
  if (!response) {
     console.warn('[LATEX TAILOR] AI returned empty response for direct LaTeX tailoring.');
     return latexCode;
  }

  let cleaned = response.trim();
  if (cleaned.startsWith('\`\`\`latex')) cleaned = cleaned.substring(8);
  else if (cleaned.startsWith('\`\`\`tex')) cleaned = cleaned.substring(6);
  else if (cleaned.startsWith('\`\`\`')) cleaned = cleaned.substring(3);
  if (cleaned.endsWith('\`\`\`')) cleaned = cleaned.substring(0, cleaned.length - 3);

  return cleaned.trim();
}
