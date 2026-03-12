import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function PUT(request) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const { tailored_id, latex_content } = await request.json();
    
    if (!tailored_id || latex_content === undefined) {
      return NextResponse.json({ error: 'tailored_id and latex_content are required.' }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('tailored_resumes')
      .update({ latex_content })
      .eq('id', tailored_id)
      .eq('user_id', auth.user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, tailored_resume: updated }, { status: 200 });
  } catch (err) {
    console.error('[UPDATE LATEX ERROR]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
