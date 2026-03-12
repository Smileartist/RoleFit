const { supabaseAdmin } = require('../config/supabase');

/**
 * Create a new project.
 */
async function createProject(userId, projectData) {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({
      user_id: userId,
      name: projectData.name,
      description: projectData.description,
      tech_stack: projectData.tech_stack || [],
      features: projectData.features || [],
      bullet_points: projectData.bullet_points || [],
      url: projectData.url || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Get all projects for a user.
 */
async function getUserProjects(userId) {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Get a single project.
 */
async function getProjectById(projectId, userId) {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw Object.assign(new Error('Project not found.'), { status: 404 });
  }
  return data;
}

/**
 * Update a project.
 */
async function updateProject(projectId, userId, updates) {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw Object.assign(new Error('Project not found.'), { status: 404 });
  return data;
}

/**
 * Delete a project.
 */
async function deleteProject(projectId, userId) {
  const { error } = await supabaseAdmin
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return { message: 'Project deleted successfully.' };
}

module.exports = { createProject, getUserProjects, getProjectById, updateProject, deleteProject };
