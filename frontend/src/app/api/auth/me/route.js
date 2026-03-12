import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const { data: user, error } = await supabaseAdmin
      .from('users').select('id, name, email, created_at').eq('id', auth.user.id).single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
