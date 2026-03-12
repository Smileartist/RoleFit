import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('projects').select('*').eq('id', id).eq('user_id', auth.user.id).single();
    if (error || !data) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    return NextResponse.json({ project: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from('projects').update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', auth.user.id).select().single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ project: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    await supabaseAdmin.from('projects').delete().eq('id', id).eq('user_id', auth.user.id);
    return NextResponse.json({ message: 'Project deleted.' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
