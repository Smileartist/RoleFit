import { chat, MODEL } from './openai';
import { safeJsonParse } from './jsonParser';

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
