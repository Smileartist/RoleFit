import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    // Check existing
    const { data: existing } = await supabaseAdmin.from('users').select('id').eq('email', email).single();
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({ name, email, password_hash })
      .select('id, name, email, created_at')
      .single();

    if (error) throw new Error(error.message);

    const token = generateToken(user);
    return NextResponse.json({ user, token }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
