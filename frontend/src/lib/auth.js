import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

/**
 * Verify JWT token from request headers.
 * Returns decoded user or a 401 NextResponse.
 */
export function verifyAuth(request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Access denied. No token provided.' }, { status: 401 }) };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { user: decoded };
  } catch {
    return { error: NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 }) };
  }
}

/**
 * Generate a JWT token.
 */
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}
