const { chat } = require('./openai');

const SYSTEM_PROMPT = `You are an ATS (Applicant Tracking System) compatibility analyst. Evaluate resumes against job descriptions.
Return ONLY valid JSON with no additional text or markdown.`;

const USER_PROMPT_TEMPLATE = `Compare the following resume and job description. Evaluate ATS compatibility.

Resume Summary:
{RESUME_SUMMARY}

Resume Skills: {RESUME_SKILLS}

Job Description:
{JOB_DESCRIPTION}

Return JSON:
{
  "ats_score": <number 0-100>,
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "keyword_gaps": ["keyword1", "keyword2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "overall_feedback": "brief overall assessment"
}`;

/**
 * Score a resume against a job description for ATS compatibility.
 */
async function scoreResume(resumeData, jobDescription) {
  const resumeSummary = typeof resumeData === 'string'
    ? resumeData
    : JSON.stringify(resumeData.experience || resumeData, null, 1).substring(0, 3000);

  const resumeSkills = Array.isArray(resumeData?.skills)
    ? resumeData.skills.join(', ')
    : 'Not specified';

  const userPrompt = USER_PROMPT_TEMPLATE
    .replace('{RESUME_SUMMARY}', resumeSummary)
    .replace('{RESUME_SKILLS}', resumeSkills)
    .replace('{JOB_DESCRIPTION}', jobDescription.substring(0, 4000));

  const response = await chat(SYSTEM_PROMPT, userPrompt, {
    jsonMode: true,
    maxTokens: 1000,
    temperature: 0.2,
  });

  try {
    return JSON.parse(response);
  } catch {
    throw new Error('Failed to parse ATS score response.');
  }
}

module.exports = { scoreResume };
