const { chat } = require('./openai');

const SYSTEM_PROMPT = `You are a professional resume optimization assistant. Rewrite resume bullets to match job requirements.
Return ONLY valid JSON with no additional text or markdown.`;

const USER_PROMPT_TEMPLATE = `Rewrite the following resume experience bullets to better match the job description.

Requirements:
- Align keywords with the job description skills
- Maintain truthfulness — do not fabricate experience
- Use strong action verbs
- Focus on measurable impact
- Keep each bullet concise (one line)

Job Description Skills: {JOB_SKILLS}

Current Resume Bullets:
{RESUME_BULLETS}

Return JSON in this format:
{
  "tailored_bullets": ["bullet1", "bullet2", ...]
}`;

/**
 * Rewrite resume bullets to match a specific job description.
 */
async function tailorResumeBullets(resumeBullets, jobSkills) {
  const bulletsText = Array.isArray(resumeBullets)
    ? resumeBullets.map((b, i) => `${i + 1}. ${b}`).join('\n')
    : resumeBullets;

  const skillsText = Array.isArray(jobSkills) ? jobSkills.join(', ') : jobSkills;

  const userPrompt = USER_PROMPT_TEMPLATE
    .replace('{JOB_SKILLS}', skillsText)
    .replace('{RESUME_BULLETS}', bulletsText);

  const response = await chat(SYSTEM_PROMPT, userPrompt, {
    jsonMode: true,
    maxTokens: 1500,
    temperature: 0.4,
  });

  try {
    return JSON.parse(response);
  } catch {
    throw new Error('Failed to parse tailored resume response.');
  }
}

module.exports = { tailorResumeBullets };
