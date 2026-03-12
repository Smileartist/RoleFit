import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import { generateLatexRaw } from '@/lib/latexUtils';

export async function POST(request) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const { resume_id, latex_template } = await request.json();
    
    // If latex_template is provided, we can optionally save it first before generating
    if (resume_id && latex_template) {
       await supabaseAdmin
         .from('resumes')
         .update({ latex_template })
         .eq('id', resume_id)
         .eq('user_id', auth.user.id);
    }

    if (!resume_id) {
      return NextResponse.json({ error: 'resume_id is required.' }, { status: 400 });
    }

    const { data: resume } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', resume_id)
      .eq('user_id', auth.user.id)
      .single();

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found.' }, { status: 404 });
    }

    const compiledLatex = generateLatexRaw(resume.structured_data || {}, resume.latex_template);
    return NextResponse.json({ latex_content: compiledLatex }, { status: 200 });
  } catch (err) {
    console.error('[RESUME LATEX GEN ERROR]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
