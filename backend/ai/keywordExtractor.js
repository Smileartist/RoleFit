const { chat } = require('./openai');

const SYSTEM_PROMPT = `You are a job description analysis assistant. Extract key information from job descriptions.
Return ONLY valid JSON with no additional text or markdown.`;

const USER_PROMPT_TEMPLATE = `Analyze the following job description and extract:

- required_skills (array of strings): specific technical skills required
- technologies (array of strings): tools, frameworks, languages mentioned
- experience_keywords (array of strings): experience-related keywords and phrases
- soft_skills (array of strings): non-technical skills mentioned
- experience_level (string): junior, mid, senior, or lead
- role_type (string): frontend, backend, fullstack, devops, data, design, or other

Job Description:
"""
{JOB_DESCRIPTION}
"""`;

/**
 * Extract skills and keywords from a job description.
 */
async function extractKeywords(jobDescription) {
  if (!jobDescription || jobDescription.trim().length < 20) {
    throw new Error('Job description is too short to analyze.');
  }

  const userPrompt = USER_PROMPT_TEMPLATE.replace(
    '{JOB_DESCRIPTION}',
    jobDescription.substring(0, 6000)
  );

  const response = await chat(SYSTEM_PROMPT, userPrompt, {
    jsonMode: true,
    maxTokens: 1000,
    temperature: 0.2,
  });

  try {
    return JSON.parse(response);
  } catch {
    throw new Error('Failed to parse keyword extraction response.');
  }
}

module.exports = { extractKeywords };
