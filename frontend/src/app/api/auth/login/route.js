import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users').select('*').eq('email', email).single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser, token });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
