import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import { generateEmail } from '@/lib/ai/emailGenerator';

export async function POST(request) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const { resume_id, job_id } = await request.json();
    if (!resume_id || !job_id) {
      return NextResponse.json({ error: 'resume_id and job_id are required.' }, { status: 400 });
    }

    const { data: resume } = await supabaseAdmin
      .from('resumes').select('structured_data').eq('id', resume_id).eq('user_id', auth.user.id).single();
    const { data: job } = await supabaseAdmin
      .from('jobs').select('*').eq('id', job_id).eq('user_id', auth.user.id).single();

    if (!resume || !job) return NextResponse.json({ error: 'Resume or job not found.' }, { status: 404 });

    const rd = resume.structured_data || {};
    const emailText = await generateEmail({
      jobTitle: job.title, company: job.company,
      candidateName: rd.name, keySkills: rd.skills, candidateSummary: rd.summary,
    });

    return NextResponse.json({ email: emailText });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
