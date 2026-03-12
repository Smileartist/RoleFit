import { generateEmbedding } from './openai';
import { supabaseAdmin } from '../supabase';

/**
 * Store embedding for a project in the database.
 * Checks if embedding already exists (cache hit) before generating.
 */
export async function storeProjectEmbedding(projectId) {
  const { data: project } = await supabaseAdmin
    .from('projects').select('*').eq('id', projectId).single();
  if (!project) throw new Error('Project not found.');

  // Cache: skip if embedding already stored
  if (project.embedding) return project.embedding;

  const text = [project.name, project.description, (project.tech_stack || []).join(', '), (project.features || []).join(', ')].filter(Boolean).join(' | ');
  const embedding = await generateEmbedding(text);

  await supabaseAdmin.from('projects').update({ embedding }).eq('id', projectId);
  return embedding;
}

/**
 * Store embedding for a job in the database.
 * Cache: skip if already exists.
 */
export async function storeJobEmbedding(jobId) {
  const { data: job } = await supabaseAdmin
    .from('jobs').select('*').eq('id', jobId).single();
  if (!job) throw new Error('Job not found.');

  // Cache: skip if embedding already stored
  if (job.embedding) return job.embedding;

  const text = [job.title, job.company, job.description?.substring(0, 4000)].filter(Boolean).join(' | ');
  const embedding = await generateEmbedding(text);

  await supabaseAdmin.from('jobs').update({ embedding }).eq('id', jobId);
  return embedding;
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find relevant projects using embedding similarity.
 * Falls back to returning all projects if embeddings aren't available.
 */
export async function findRelevantProjects(jobId, userId, limit = 3) {
  // Get job embedding (cached or generate)
  let jobEmbedding;
  try {
    jobEmbedding = await storeJobEmbedding(jobId);
  } catch {
    // Fallback: return user projects without ranking
    const { data: projects } = await supabaseAdmin
      .from('projects').select('*').eq('user_id', userId).limit(limit);
    return projects || [];
  }

  // Get all user projects
  const { data: projects } = await supabaseAdmin
    .from('projects').select('*').eq('user_id', userId);

  if (!projects || projects.length === 0) return [];

  // Generate embeddings for projects that don't have them (cached)
  for (const project of projects) {
    if (!project.embedding) {
      try {
        project.embedding = await storeProjectEmbedding(project.id);
      } catch {
        // skip if embedding fails
      }
    }
  }

  // Rank by cosine similarity if both embeddings exist
  const ranked = projects.map(p => {
    let sim = 0;
    if (jobEmbedding && p.embedding) {
      sim = cosineSimilarity(jobEmbedding, p.embedding);
    }
    return { ...p, similarity: sim };
  })
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, limit);

  return ranked;
}
