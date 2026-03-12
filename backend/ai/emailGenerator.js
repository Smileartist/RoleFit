const { chat } = require('./openai');

const SYSTEM_PROMPT = `You are a professional email writing assistant. Generate concise, professional job application emails.`;

const USER_PROMPT_TEMPLATE = `Generate a professional job application email using the following information.

Job Title: {JOB_TITLE}
Company Name: {COMPANY}
Candidate Name: {CANDIDATE_NAME}
Key Skills: {KEY_SKILLS}
Candidate Summary: {CANDIDATE_SUMMARY}

Requirements:
- Professional and confident tone
- 5-8 sentences maximum
- Include a clear subject line
- Mention relevant skills that match the role
- End with a professional sign-off

Return the email as plain text with "Subject:" on the first line.`;

/**
 * Generate a professional job application email.
 */
async function generateEmail({ jobTitle, company, candidateName, keySkills, candidateSummary }) {
  const userPrompt = USER_PROMPT_TEMPLATE
    .replace('{JOB_TITLE}', jobTitle || 'the open position')
    .replace('{COMPANY}', company || 'your company')
    .replace('{CANDIDATE_NAME}', candidateName || 'the candidate')
    .replace('{KEY_SKILLS}', Array.isArray(keySkills) ? keySkills.join(', ') : (keySkills || ''))
    .replace('{CANDIDATE_SUMMARY}', candidateSummary || '');

  const response = await chat(SYSTEM_PROMPT, userPrompt, {
    maxTokens: 500,
    temperature: 0.6,
  });

  return response;
}

module.exports = { generateEmail };
