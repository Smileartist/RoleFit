import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import { generateLatexRaw } from '@/lib/latexUtils';

export async function POST(request) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const { tailored_id, use_original } = await request.json();
    if (!tailored_id) {
      return NextResponse.json({ error: 'tailored_id is required.' }, { status: 400 });
    }

    // Fetch tailored resume
    const { data: tailored } = await supabaseAdmin
      .from('tailored_resumes')
      .select('*, resumes(structured_data, created_at)')
      .eq('id', tailored_id)
      .eq('user_id', auth.user.id)
      .single();

    if (!tailored) {
      return NextResponse.json({ error: 'Tailored resume not found.' }, { status: 404 });
    }

    if (use_original) {
      const originalData = tailored.resumes?.structured_data;
      if (!originalData) return NextResponse.json({ error: 'Original data missing.' }, { status: 400 });
      const originalLatex = generateLatexRaw(originalData);
      return NextResponse.json({ latex_content: originalLatex }, { status: 200 });
    }

    // The full tailored payload combines the base structured details with the AI optimizations
    const tailoredData = tailored.tailored_data;
    if (!tailoredData) {
      return NextResponse.json({ error: 'Tailored data is empty.' }, { status: 400 });
    }

    // If the user already edited the latex, or we already generated it, just return it.
    if (tailored.latex_content) {
      return NextResponse.json({ latex_content: tailored.latex_content }, { status: 200 });
    }

    const latexString = generateLatexRaw(tailoredData);

    // Save to database just in case the user wants to fetch it later
    await supabaseAdmin
      .from('tailored_resumes')
      .update({ latex_content: latexString })
      .eq('id', tailored_id);

    return NextResponse.json({ latex_content: latexString }, { status: 200 });

  } catch (err) {
    console.error('[PDF GEN ERROR]', err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
