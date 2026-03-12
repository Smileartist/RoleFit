import { chat, MODEL } from './openai';
import { safeJsonParse } from './jsonParser';

export async function scoreResume(resumeData, jobDescription) {
  const resumeSummary = typeof resumeData === 'string' ? resumeData : JSON.stringify(resumeData.experience || resumeData, null, 1).substring(0, 3000);
  const resumeSkills = Array.isArray(resumeData?.skills) ? resumeData.skills.join(', ') : 'Not specified';

  const system = `You are an ATS compatibility analyst. Return ONLY valid JSON.`;
  const user = `Compare resume and job description for ATS compatibility.

Resume Skills: ${resumeSkills}
Resume Summary: ${resumeSummary}

Job Description:
${jobDescription.substring(0, 4000)}

Return JSON: { "ats_score": <0-100>, "matched_skills": [], "missing_skills": [], "keyword_gaps": [], "suggestions": [], "overall_feedback": "" }`;

  // LIGHT model — scoring is a structured analysis task
  const response = await chat(system, user, { model: MODEL.LIGHT, temperature: 0.2 });
  console.log('[DEBUG RAW AI OUTPUT LENGTH]:', response.length);
  console.log('[DEBUG RAW AI OUTPUT TEXT]:\n' + response + '\n===END===');
  const parsed = safeJsonParse(response, { ats_score: 50, matched_skills: [], missing_skills: [], suggestions: ['Unable to fully analyze — try again.'], overall_feedback: '' });
  return parsed;
}
