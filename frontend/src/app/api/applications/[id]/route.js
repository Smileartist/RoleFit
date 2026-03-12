import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function PUT(request, { params }) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const updateData = { ...body, updated_at: new Date().toISOString() };
    if (body.status === 'applied') updateData.applied_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('applications').update(updateData)
      .eq('id', id).eq('user_id', auth.user.id)
      .select('*, jobs(title, company)').single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ application: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    await supabaseAdmin.from('applications').delete().eq('id', id).eq('user_id', auth.user.id);
    return NextResponse.json({ message: 'Application deleted.' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
