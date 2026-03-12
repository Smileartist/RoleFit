const { supabaseAdmin } = require('../config/supabase');

/**
 * Create a new application entry.
 */
async function createApplication(userId, appData) {
  const { data, error } = await supabaseAdmin
    .from('applications')
    .insert({
      user_id: userId,
      job_id: appData.job_id,
      tailored_resume_id: appData.tailored_resume_id || null,
      status: appData.status || 'saved',
      notes: appData.notes || null,
      applied_at: appData.status === 'applied' ? new Date().toISOString() : null,
    })
    .select('*, jobs(title, company)')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Get all applications for a user.
 */
async function getUserApplications(userId) {
  const { data, error } = await supabaseAdmin
    .from('applications')
    .select('*, jobs(title, company)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update application status.
 * Valid statuses: saved, applied, assessment, interview, offer, rejected
 */
async function updateApplication(appId, userId, updates) {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // Auto-set applied_at timestamp when status changes to "applied"
  if (updates.status === 'applied') {
    updateData.applied_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('applications')
    .update(updateData)
    .eq('id', appId)
    .eq('user_id', userId)
    .select('*, jobs(title, company)')
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw Object.assign(new Error('Application not found.'), { status: 404 });
  return data;
}

/**
 * Delete an application.
 */
async function deleteApplication(appId, userId) {
  const { error } = await supabaseAdmin
    .from('applications')
    .delete()
    .eq('id', appId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return { message: 'Application deleted successfully.' };
}

module.exports = { createApplication, getUserApplications, updateApplication, deleteApplication };
