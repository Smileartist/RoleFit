import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const { data, error } = await supabaseAdmin
      .from('projects').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ projects: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    if (!body.name) return NextResponse.json({ error: 'Project name is required.' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: auth.user.id, name: body.name, description: body.description,
        tech_stack: body.tech_stack || [], features: body.features || [],
        bullet_points: body.bullet_points || [], url: body.url || null,
      })
      .select().single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ project: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
