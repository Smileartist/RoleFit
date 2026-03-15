const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

const SALT_ROUNDS = 10;

/**
 * Register a new user.
 */
async function register({ name, email, password }) {
  // Check if user already exists
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    throw Object.assign(new Error('User with this email already exists.'), { status: 409 });
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert user
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert({ name, email, password_hash })
    .select('id, name, email, created_at')
    .single();

  if (error) throw new Error(error.message);

  const token = generateToken(user);
  return { user, token };
}

/**
 * Login an existing user.
 */
async function login({ email, password }) {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw Object.assign(new Error('Invalid email or password.'), { status: 401 });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw Object.assign(new Error('Invalid email or password.'), { status: 401 });
  }

  const token = generateToken(user);
  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token };
}

/**
 * Get user profile by ID.
 */
async function getProfile(userId) {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, created_at')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw Object.assign(new Error('User not found.'), { status: 404 });
  }

  return user;
}

/**
 * Update user profile.
 */
async function updateProfile(userId, { name }) {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update({ name })
    .eq('id', userId)
    .select('id, name, email, created_at')
    .single();

  if (error) throw new Error(error.message);
  return user;
}

/**
 * Update user password.
 */
async function updatePassword(userId, { currentPassword, newPassword }) {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw Object.assign(new Error('User not found.'), { status: 404 });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    throw Object.assign(new Error('Current password is incorrect.'), { status: 401 });
  }

  const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ password_hash })
    .eq('id', userId);

  if (updateError) throw new Error(updateError.message);
  return { message: 'Password updated successfully' };
}

/**
 * Delete user account and all associated data.
 */
async function deleteAccount(userId) {
  // Cascading deletes should be handled by DB if possible, but let's be explicit if needed.
  // Assuming foreign keys are set to ON DELETE CASCADE in Supabase/Postgres.
  // If not, we might need to delete from resumes, projects, etc. manually.
  
  const { error } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) throw new Error(error.message);
  return { message: 'Account deleted successfully' };
}

/**
 * Generate a JWT token for a user.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { register, login, getProfile, updateProfile, updatePassword, deleteAccount };
