import { chat, MODEL } from './openai';

export async function generateEmail({ jobTitle, company, candidateName, keySkills, candidateSummary }) {
  const system = `You are a professional email writing assistant.`;
  const user = `Generate a professional job application email (5-8 sentences).

Job Title: ${jobTitle || 'the open position'}
Company: ${company || 'your company'}
Candidate: ${candidateName || 'the candidate'}
Skills: ${Array.isArray(keySkills) && keySkills.length > 0 ? keySkills.join(', ') : 'Not specified'}
Summary: ${candidateSummary || 'Not specified'}

Return with "Subject:" on the first line. Do not cut off the email.`;

  // LIGHT model — simple text generation
  return chat(system, user, { model: MODEL.LIGHT, maxTokens: 4500, temperature: 0.6 });
}
