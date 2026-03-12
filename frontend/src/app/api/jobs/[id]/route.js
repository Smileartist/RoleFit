import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('jobs').select('*').eq('id', id).eq('user_id', auth.user.id).single();
    if (error || !data) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    return NextResponse.json({ job: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    await supabaseAdmin.from('jobs').delete().eq('id', id).eq('user_id', auth.user.id);
    return NextResponse.json({ message: 'Job deleted.' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
