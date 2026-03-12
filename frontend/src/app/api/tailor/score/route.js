import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import { scoreResume } from '@/lib/ai/atsScorer';

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
      .from('jobs').select('description').eq('id', job_id).eq('user_id', auth.user.id).single();

    if (!resume || !job) return NextResponse.json({ error: 'Resume or job not found.' }, { status: 404 });

    const atsResult = await scoreResume(resume.structured_data, job.description);
    return NextResponse.json({ ats: atsResult });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
