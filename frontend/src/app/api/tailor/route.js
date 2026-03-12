import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import { extractKeywords } from '@/lib/ai/keywordExtractor';
import { tailorResumeBullets, tailorSkills } from '@/lib/ai/resumeTailor';
import { scoreResume } from '@/lib/ai/atsScorer';
import { generateProjectBullets } from '@/lib/ai/projectBulletGenerator';
import { findRelevantProjects } from '@/lib/ai/embeddings';

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

    // 1. Extract keywords (cached in DB via extracted_skills column)
    let extractedSkills = job.extracted_skills;
    if (!extractedSkills) {
      extractedSkills = await extractKeywords(job.description);
      await supabaseAdmin.from('jobs').update({ extracted_skills: extractedSkills }).eq('id', job_id);
    }

    // 2. Find relevant projects (uses embedding cache internally)
    const relevantProjects = await findRelevantProjects(job_id, auth.user.id, 3);

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

    const allSkillsForPrompt = [...(extractedSkills.required_skills || []), ...(extractedSkills.technologies || [])];
    const allSkillsStr = allSkillsForPrompt.join(', ');

    let tailoredBullets = { tailored_bullets: allBullets };
    if (allBullets.length > 0) {
      console.log('[TAILOR] Calling tailorResumeBullets...');
      tailoredBullets = await tailorResumeBullets(allBullets, allSkillsForPrompt);
      console.log('[TAILOR] Returned tailored bullets:', tailoredBullets?.tailored_bullets?.length);
    } else {
      console.log('[TAILOR] Skipping tailorResumeBullets because allBullets is empty');
    }

    // 3.5 Tailor Skills
    let tailoredSkills = resumeData.skills || [];
    if (tailoredSkills.length > 0) {
      console.log('[TAILOR] Calling tailorSkills...');
      try {
        const ts = await tailorSkills(tailoredSkills, allSkillsForPrompt);
        if (ts && ts.tailored_skills) tailoredSkills = ts.tailored_skills;
      } catch (e) {
        console.warn('[TAILOR] tailorSkills failed:', e.message);
      }
    }

    // 4. Generate project bullets (dynamically tailored to job)
    const projectBullets = [];
    console.log('[TAILOR] Generating tailored project bullets for', relevantProjects.length, 'projects');
    for (const project of relevantProjects) {
      try {
        const bullets = await generateProjectBullets(project, job.title, allSkillsStr);
        projectBullets.push({ ...project, bullet_points: bullets.bullet_points });
      } catch { 
        projectBullets.push(project); 
      }
    }

    // 5. Original ATS Score
    console.log('[TAILOR] Scoring original resume...');
    const originalAtsResult = await scoreResume(resumeData, job.description);
    console.log('[TAILOR] Original ATS Score:', originalAtsResult?.ats_score);

    const tailoredData = {
      ...resumeData,
      skills: tailoredSkills, // override original skills with tailored prioritization
      tailored_experience_bullets: tailoredBullets.tailored_bullets,
      selected_projects: projectBullets,
      job_skills: extractedSkills,
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
