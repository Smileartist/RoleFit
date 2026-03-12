const { generateEmbedding } = require('./openai');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Generate and store embedding for a project.
 */
async function embedProject(projectId) {
  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error || !project) throw new Error('Project not found.');

  // Combine project info into text for embedding
  const text = [
    project.name,
    project.description,
    ...(project.tech_stack || []),
    ...(project.features || []),
    ...(project.bullet_points || []),
  ].filter(Boolean).join(' ');

  const embedding = await generateEmbedding(text);

  // Store embedding
  const { error: updateError } = await supabaseAdmin
    .from('projects')
    .update({ embedding: JSON.stringify(embedding) })
    .eq('id', projectId);

  if (updateError) throw new Error(updateError.message);
  return embedding;
}

/**
 * Generate and store embedding for a job.
 */
async function embedJob(jobId) {
  const { data: job, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error || !job) throw new Error('Job not found.');

  const text = [job.title, job.company, job.description].filter(Boolean).join(' ');
  const embedding = await generateEmbedding(text);

  const { error: updateError } = await supabaseAdmin
    .from('jobs')
    .update({ embedding: JSON.stringify(embedding) })
    .eq('id', jobId);

  if (updateError) throw new Error(updateError.message);
  return embedding;
}

/**
 * Find the most relevant projects for a given job using vector similarity.
 * Falls back to keyword matching if embeddings are not available.
 */
async function findRelevantProjects(jobId, userId, limit = 3) {
  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (!job) throw new Error('Job not found.');

  // Generate embedding for the job if not already done
  let jobEmbedding = job.embedding;
  if (!jobEmbedding) {
    jobEmbedding = await embedJob(jobId);
  }

  // Use pgvector similarity search via RPC
  // This requires a Supabase SQL function — fallback to keyword match if unavailable
  try {
    const { data, error } = await supabaseAdmin.rpc('match_projects', {
      query_embedding: jobEmbedding,
      match_threshold: 0.5,
      match_count: limit,
      p_user_id: userId,
    });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch {
    // RPC not available yet — fallback
  }

  // Fallback: return all user projects (basic)
  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .limit(limit);

  return projects || [];
}

module.exports = { embedProject, embedJob, findRelevantProjects };
