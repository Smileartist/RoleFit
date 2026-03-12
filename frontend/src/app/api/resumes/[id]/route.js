import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// GET single resume
export async function GET(request, { params }) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('resumes').select('*').eq('id', id).eq('user_id', auth.user.id).single();
    if (error || !data) return NextResponse.json({ error: 'Resume not found.' }, { status: 404 });
    return NextResponse.json({ resume: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE resume
export async function DELETE(request, { params }) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    // Delete dependent tailored_resumes first (foreign key)
    await supabaseAdmin.from('tailored_resumes').delete().eq('resume_id', id).eq('user_id', auth.user.id);
    // Now delete the resume
    const { error } = await supabaseAdmin.from('resumes').delete().eq('id', id).eq('user_id', auth.user.id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ message: 'Resume deleted.' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
