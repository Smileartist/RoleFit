import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const { data, error } = await supabaseAdmin
      .from('applications').select('*, jobs(title, company)')
      .eq('user_id', auth.user.id).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ applications: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    if (!body.job_id) return NextResponse.json({ error: 'job_id is required.' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert({
        user_id: auth.user.id, job_id: body.job_id,
        tailored_resume_id: body.tailored_resume_id || null,
        status: body.status || 'saved', notes: body.notes || null,
        applied_at: body.status === 'applied' ? new Date().toISOString() : null,
      })
      .select('*, jobs(title, company)').single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ application: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
