import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import { extractKeywords } from '@/lib/ai/keywordExtractor';
import { tailorResumeBullets, tailorSkills, tailorLatexTemplate } from '@/lib/ai/resumeTailor';
import { scoreResume } from '@/lib/ai/atsScorer';
import { generateProjectBullets } from '@/lib/ai/projectBulletGenerator';
import { findRelevantProjects } from '@/lib/ai/embeddings';

export const maxDuration = 60;

// GET tailored resumes
export async function GET(request) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const { data, error } = await supabaseAdmin
      .from('tailored_resumes')
      .select('*, jobs(title, company), resumes(title)')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ tailored_resumes: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE a tailored resume
export async function DELETE(request) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('tailored_resumes')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id);
      
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: full tailoring pipeline
export async function POST(request) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const { resume_id, job_id, force } = await request.json();
    if (!resume_id || !job_id) {
      return NextResponse.json({ error: 'resume_id and job_id are required.' }, { status: 400 });
    }

    // TAILORING CACHE: check if this exact resume+job combo was already tailored
    if (!force) {
      const { data: cached } = await supabaseAdmin
        .from('tailored_resumes')
        .select('*')
        .eq('user_id', auth.user.id)
        .eq('resume_id', resume_id)
        .eq('job_id', job_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (cached) {
        // Return cached result — zero AI cost
        return NextResponse.json({ tailored_resume: cached, cached: true });
      }
    } else {
      // Force mode: delete old cached results for this combo
      await supabaseAdmin
        .from('tailored_resumes')
        .delete()
        .eq('user_id', auth.user.id)
        .eq('resume_id', resume_id)
        .eq('job_id', job_id);
    }

    // Fetch resume and job
    const { data: resume } = await supabaseAdmin
      .from('resumes').select('*').eq('id', resume_id).eq('user_id', auth.user.id).single();
    const { data: job } = await supabaseAdmin
      .from('jobs').select('*').eq('id', job_id).eq('user_id', auth.user.id).single();

    if (!resume) return NextResponse.json({ error: 'Resume not found.' }, { status: 404 });
    if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

    // 1 & 2. Keywords & Projects in Parallel
    console.log('[TAILOR] Fetching keywords and relevant projects concurrently...');
    const [extractedSkills, relevantProjects] = await Promise.all([
       job.extracted_skills ? Promise.resolve(job.extracted_skills) : extractKeywords(job.description),
       findRelevantProjects(job_id, auth.user.id, 3)
    ]);

    // Save keywords if they were just fetched
    if (!job.extracted_skills && extractedSkills) {
       await supabaseAdmin.from('jobs').update({ extracted_skills: extractedSkills }).eq('id', job_id);
    }

    // 3. Tailor resume bullets — ONLY send relevant sections (section-level optimization)
    const resumeData = resume.structured_data || {};
    console.log('[TAILOR] Struct data keys:', Object.keys(resumeData));
    const allBullets = [];
    if (resumeData.experience) {
      for (const exp of resumeData.experience) {
        if (exp.bullets) allBullets.push(...exp.bullets);
      }
    }
    console.log('[TAILOR] Found experience bullets:', allBullets.length);

    const allSkillsForPrompt = [...(extractedSkills?.required_skills || []), ...(extractedSkills?.technologies || [])];
    const allSkillsStr = allSkillsForPrompt.join(', ');

    let tailoredSkills = resumeData.skills || [];

    // 3. Parallelize Bullets & Skills Tailoring
    console.log('[TAILOR] Tailoring bullets and skills concurrently...');
    const [tailoredBulletsRes, tsRes] = await Promise.allSettled([
       allBullets.length > 0 ? tailorResumeBullets(allBullets, allSkillsForPrompt) : Promise.resolve({ tailored_bullets: allBullets }),
       tailoredSkills.length > 0 ? tailorSkills(tailoredSkills, allSkillsForPrompt) : Promise.resolve({ tailored_skills: tailoredSkills })
    ]);

    let tailoredBullets = { tailored_bullets: allBullets };
    if (tailoredBulletsRes.status === 'fulfilled' && tailoredBulletsRes.value) {
       tailoredBullets = tailoredBulletsRes.value;
       console.log('[TAILOR] Returned tailored bullets:', tailoredBullets?.tailored_bullets?.length);
    }

    if (tsRes.status === 'fulfilled' && tsRes.value?.tailored_skills) {
       tailoredSkills = tsRes.value.tailored_skills;
       console.log('[TAILOR] Returned tailored skills:', tailoredSkills.length);
    }

    // 4. Parallelize Projects Generation Loop
    console.log('[TAILOR] Generating tailored project bullets for', relevantProjects.length, 'projects concurrently...');
    const projectBullets = await Promise.all(
       relevantProjects.map(async (project) => {
          try {
             const bullets = await generateProjectBullets(project, job.title, allSkillsStr);
             return { ...project, bullet_points: bullets.bullet_points };
          } catch {
             return project;
          }
       })
    );

    // 5 & 4.5. Concurrent scoring and direct LaTeX tailoring
    console.log('[TAILOR] Scoring original and tailoring LaTeX concurrently...');
    const [originalAtsResult, tailoredLatex] = await Promise.all([
       scoreResume(resumeData, job.description),
       resume.latex_template ? tailorLatexTemplate(resume.latex_template, job.description).catch(e => {
          console.warn('[TAILOR] Direct LaTeX tailoring failed:', e.message);
          return null;
       }) : Promise.resolve(null)
    ]);

    const tailoredData = {
      ...resumeData,
      skills: tailoredSkills, 
      tailored_experience_bullets: tailoredBullets.tailored_bullets,
      selected_projects: projectBullets,
      job_skills: extractedSkills,
      latex_code: tailoredLatex 
    };

    // 6. Tailored ATS Score
    console.log('[TAILOR] Scoring tailored resume...');
    const tailoredAtsResult = await scoreResume(tailoredData, job.description);
    console.log('[TAILOR] Tailored ATS Score:', tailoredAtsResult?.ats_score);

    // Bundle the feedback for UI comparison
    const combinedFeedback = {
      ...tailoredAtsResult,
      original_score: originalAtsResult?.ats_score || 0,
      original_suggestions: originalAtsResult?.suggestions || []
    };

    // Store tailored resume (becomes the cache for future identical requests)
    const { data: tailored, error } = await supabaseAdmin
      .from('tailored_resumes')
      .insert({
        user_id: auth.user.id, resume_id, job_id,
        tailored_data: tailoredData, ats_score: tailoredAtsResult.ats_score,
        ats_feedback: combinedFeedback, selected_projects: relevantProjects.map(p => p.id),
      })
      .select().single();

    if (error) throw new Error(error.message);
    console.log('[TAILOR] Successfully generated tailored resume:', tailored.id);
    return NextResponse.json({ tailored_resume: tailored }, { status: 201 });
  } catch (err) {
    console.error('[TAILOR] FATAL ERROR:', err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
