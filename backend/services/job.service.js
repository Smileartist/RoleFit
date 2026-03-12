const { supabaseAdmin } = require('../config/supabase');
const cheerio = require('cheerio');

/**
 * Scrape job description from a URL.
 */
async function scrapeJobDescription(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch job page (${response.status})`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, nav, footer
    $('script, style, nav, footer, header, iframe').remove();

    // Try common job description selectors
    const selectors = [
      '.job-description',
      '.description__text',
      '[data-job-description]',
      '.job-details',
      '#job-description',
      '.posting-description',
      'article',
      'main',
    ];

    let text = '';
    for (const sel of selectors) {
      const el = $(sel);
      if (el.length && el.text().trim().length > 100) {
        text = el.text().trim();
        break;
      }
    }

    // Fallback: get body text
    if (!text) {
      text = $('body').text().trim();
    }

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Limit to reasonable length
    if (text.length > 10000) {
      text = text.substring(0, 10000);
    }

    return text;
  } catch (err) {
    console.error('Job scrape error:', err.message);
    throw Object.assign(new Error('Could not extract job description from link.'), { status: 400 });
  }
}

/**
 * Create a new job entry.
 */
async function createJob(userId, jobData) {
  let description = jobData.description;

  // If a URL is provided but no description, try to scrape it
  if (!description && jobData.source_url) {
    description = await scrapeJobDescription(jobData.source_url);
  }

  if (!description || description.trim().length < 20) {
    throw Object.assign(new Error('Job description is required (paste text or provide a link).'), { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .insert({
      user_id: userId,
      title: jobData.title || null,
      company: jobData.company || null,
      description,
      source_url: jobData.source_url || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Get all jobs for a user.
 */
async function getUserJobs(userId) {
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Get a single job by ID.
 */
async function getJobById(jobId, userId) {
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw Object.assign(new Error('Job not found.'), { status: 404 });
  }
  return data;
}

/**
 * Delete a job.
 */
async function deleteJob(jobId, userId) {
  const { error } = await supabaseAdmin
    .from('jobs')
    .delete()
    .eq('id', jobId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return { message: 'Job deleted successfully.' };
}

module.exports = { createJob, getUserJobs, getJobById, deleteJob, scrapeJobDescription };
