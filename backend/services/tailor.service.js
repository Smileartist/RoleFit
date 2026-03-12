const { supabaseAdmin } = require('../config/supabase');
const { extractKeywords } = require('../ai/keywordExtractor');
const { tailorResumeBullets } = require('../ai/resumeTailor');
const { scoreResume } = require('../ai/atsScorer');
const { generateEmail } = require('../ai/emailGenerator');
const { generateProjectBullets } = require('../ai/projectBulletGenerator');
const { findRelevantProjects } = require('../ai/embeddings');

/**
 * Full resume tailoring pipeline:
 * 1. Extract keywords from JD
 * 2. Select relevant projects
 * 3. Rewrite resume bullets
 * 4. Score ATS compatibility
 * 5. Store tailored resume
 */
async function tailorResume(userId, resumeId, jobId) {
  // Fetch resume and job
  const { data: resume } = await supabaseAdmin
    .from('resumes')
    .select('*')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single();

  if (!resume) throw Object.assign(new Error('Resume not found.'), { status: 404 });

  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (!job) throw Object.assign(new Error('Job not found.'), { status: 404 });

  // Step 1: Extract keywords from job description
  let extractedSkills = job.extracted_skills;
  if (!extractedSkills) {
    extractedSkills = await extractKeywords(job.description);
    // Cache extracted skills on the job
    await supabaseAdmin
      .from('jobs')
      .update({ extracted_skills: extractedSkills })
      .eq('id', jobId);
  }

  // Step 2: Find relevant projects
  const relevantProjects = await findRelevantProjects(jobId, userId, 3);

  // Step 3: Tailor resume bullets
  const resumeData = resume.structured_data || {};
  const allBullets = [];

  // Gather experience bullets
  if (resumeData.experience) {
    for (const exp of resumeData.experience) {
      if (exp.bullets) allBullets.push(...exp.bullets);
    }
  }

  let tailoredBullets = { tailored_bullets: allBullets };
  if (allBullets.length > 0) {
    const allSkills = [
      ...(extractedSkills.required_skills || []),
      ...(extractedSkills.technologies || []),
    ];
    tailoredBullets = await tailorResumeBullets(allBullets, allSkills);
  }

  // Step 4: Generate project bullets for selected projects
  const projectBullets = [];
  for (const project of relevantProjects) {
    if (!project.bullet_points || project.bullet_points.length === 0) {
      try {
        const bullets = await generateProjectBullets(project);
        projectBullets.push({ ...project, bullet_points: bullets.bullet_points });
      } catch {
        projectBullets.push(project);
      }
    } else {
      projectBullets.push(project);
    }
  }

  // Build tailored data
  const tailoredData = {
    ...resumeData,
    tailored_experience_bullets: tailoredBullets.tailored_bullets,
    selected_projects: projectBullets,
    job_skills: extractedSkills,
  };

  // Step 5: ATS Score
  const atsResult = await scoreResume(resumeData, job.description);

  // Store tailored resume
  const { data: tailored, error } = await supabaseAdmin
    .from('tailored_resumes')
    .insert({
      user_id: userId,
      resume_id: resumeId,
      job_id: jobId,
      tailored_data: tailoredData,
      ats_score: atsResult.ats_score,
      ats_feedback: atsResult,
      selected_projects: relevantProjects.map(p => p.id),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return tailored;
}

/**
 * Get ATS score for a resume against a job.
 */
async function getAtsScore(userId, resumeId, jobId) {
  const { data: resume } = await supabaseAdmin
    .from('resumes')
    .select('structured_data')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single();

  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('description')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (!resume || !job) throw Object.assign(new Error('Resume or job not found.'), { status: 404 });

  return scoreResume(resume.structured_data, job.description);
}

/**
 * Generate an application email.
 */
async function getApplicationEmail(userId, resumeId, jobId) {
  const { data: resume } = await supabaseAdmin
    .from('resumes')
    .select('structured_data')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single();

  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (!resume || !job) throw Object.assign(new Error('Resume or job not found.'), { status: 404 });

  const rd = resume.structured_data || {};

  return generateEmail({
    jobTitle: job.title,
    company: job.company,
    candidateName: rd.name,
    keySkills: rd.skills,
    candidateSummary: rd.summary,
  });
}

/**
 * Get user's tailored resumes.
 */
async function getTailoredResumes(userId) {
  const { data, error } = await supabaseAdmin
    .from('tailored_resumes')
    .select('*, jobs(title, company), resumes(title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

module.exports = { tailorResume, getAtsScore, getApplicationEmail, getTailoredResumes };
