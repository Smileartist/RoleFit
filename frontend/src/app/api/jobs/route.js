import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import * as cheerio from 'cheerio';
import { extractKeywords } from '@/lib/ai/keywordExtractor';
import { storeJobEmbedding } from '@/lib/ai/embeddings';
import crypto from 'crypto';

/**
 * Generate a hash of the JD text for cache lookups.
 */
function hashDescription(text) {
  return crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex').substring(0, 32);
}

async function scrapeJobDescription(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!response.ok) throw new Error(`Failed to fetch job page (${response.status})`);

  const html = await response.text();
  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, iframe').remove();

  const selectors = ['.job-description', '.description__text', '[data-job-description]', '.job-details', '#job-description', '.posting-description', 'article', 'main'];
  let text = '';
  for (const sel of selectors) {
    const el = $(sel);
    if (el.length && el.text().trim().length > 100) { text = el.text().trim(); break; }
  }
  if (!text) text = $('body').text().trim();
  return text.replace(/\s+/g, ' ').trim().substring(0, 10000);
}

export async function GET(request) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const { data, error } = await supabaseAdmin
      .from('jobs').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ jobs: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    let description = body.description;

    if (!description && body.source_url) {
      description = await scrapeJobDescription(body.source_url);
    }
    if (!description || description.trim().length < 20) {
      return NextResponse.json({ error: 'Job description is required.' }, { status: 400 });
    }

    // JD hash cache: check if we've already analyzed an identical JD
    const descHash = hashDescription(description);
    let cachedSkills = null;
    let existingJob = null;
    try {
      const result = await supabaseAdmin
        .from('jobs')
        .select('extracted_skills, title, company')
        .eq('description_hash', descHash)
        .not('extracted_skills', 'is', null)
        .limit(1)
        .single();
      existingJob = result.data;
    } catch (e) { }

    if (existingJob?.extracted_skills) {
      cachedSkills = existingJob.extracted_skills;
    }

    let finalTitle = body.title?.trim() || null;
    let finalCompany = body.company?.trim() || null;

    // We need title/company. Avoid skipping extraction if the cache itself is missing the title.
    const needsExtraction = !cachedSkills || 
      (!cachedSkills.job_title && (!existingJob || existingJob.title === 'Untitled Role') && !finalTitle);

    if (needsExtraction) {
      try {
        const freshSkills = await extractKeywords(description);
        cachedSkills = { ...(cachedSkills || {}), ...freshSkills };
        
        // Auto-heal the legacy database row behind the scenes if we had a cache hit
        if (existingJob && (!existingJob.title || existingJob.title === 'Untitled Role')) {
           await supabaseAdmin.from('jobs').update({
             title: freshSkills.job_title || 'Untitled Role',
             company: freshSkills.company_name || existingJob.company || 'Unknown Company',
             extracted_skills: cachedSkills
           }).eq('description_hash', descHash);
        }
      } catch (err) {
        console.error('[JOBS] Keyword extraction failed:', err);
      }
    }

    // Assign final values in order of preference (AI > Cache > User Input)
    finalTitle = cachedSkills?.job_title || existingJob?.title || finalTitle || 'Untitled Role';
    finalCompany = cachedSkills?.company_name || existingJob?.company || finalCompany || 'Unknown Company';

    // Insert job
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .insert({
        user_id: auth.user.id, title: finalTitle, company: finalCompany,
        description, source_url: body.source_url || null,
        description_hash: descHash,
        extracted_skills: cachedSkills, // reuse cached skills if available
      })
      .select().single();

    if (error) throw new Error(error.message);

    // Background: generate embedding
    storeJobEmbedding(data.id).catch(() => {});

    return NextResponse.json({ job: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
