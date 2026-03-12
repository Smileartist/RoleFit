const { chat } = require('./openai');

const SYSTEM_PROMPT = `You are a resume writing assistant. Generate strong resume bullet points from project descriptions.
Return ONLY valid JSON with no additional text or markdown.`;

const USER_PROMPT_TEMPLATE = `Convert the following project description into strong resume bullet points.

Requirements:
- Use strong action verbs (Developed, Implemented, Engineered, Architected, etc.)
- Focus on technical impact and quantifiable results
- Generate exactly 3-4 bullet points
- Keep each bullet concise and impactful

Project Name: {PROJECT_NAME}
Tech Stack: {TECH_STACK}
Description: {DESCRIPTION}
Features: {FEATURES}

Return JSON:
{
  "bullet_points": ["bullet1", "bullet2", "bullet3"]
}`;

/**
 * Generate resume bullet points from a project description.
 */
async function generateProjectBullets(project) {
  const userPrompt = USER_PROMPT_TEMPLATE
    .replace('{PROJECT_NAME}', project.name || '')
    .replace('{TECH_STACK}', Array.isArray(project.tech_stack) ? project.tech_stack.join(', ') : (project.tech_stack || ''))
    .replace('{DESCRIPTION}', project.description || '')
    .replace('{FEATURES}', Array.isArray(project.features) ? project.features.join(', ') : (project.features || ''));

  const response = await chat(SYSTEM_PROMPT, userPrompt, {
    jsonMode: true,
    maxTokens: 800,
    temperature: 0.5,
  });

  try {
    return JSON.parse(response);
  } catch {
    throw new Error('Failed to parse project bullets response.');
  }
}

module.exports = { generateProjectBullets };
