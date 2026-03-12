import { chat, MODEL } from './openai';
import { safeJsonParse } from './jsonParser';

export async function generateProjectBullets(project, jobTitle = '', jobSkills = '') {
  const system = `You are a resume writing assistant. Return ONLY valid JSON.`;
  const user = `Convert this project into 3-4 resume bullet points. Use action verbs, focus on technical impact.
${jobTitle ? `Tailor the bullets to highlight skills relevant to this job title: ${jobTitle}` : ''}
${jobSkills ? `Make sure to emphasize these skills if applicable: ${jobSkills}` : ''}

Project: ${project.name || ''}
Tech: ${Array.isArray(project.tech_stack) ? project.tech_stack.join(', ') : (project.tech_stack || '')}
Description: ${project.description || ''}
Features: ${Array.isArray(project.features) ? project.features.join(', ') : (project.features || '')}

Return JSON: { "bullet_points": ["bullet1", "bullet2", "bullet3"] }`;

  // MID model — bullet generation needs quality writing
  const response = await chat(system, user, { model: MODEL.MID, temperature: 0.5 });
  const parsed = safeJsonParse(response, { bullet_points: [] });
  return parsed;
}
