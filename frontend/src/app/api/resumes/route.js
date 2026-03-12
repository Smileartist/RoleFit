import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import { structureResume } from '@/lib/ai/resumeStructurer';
import { cloneLatexTemplate } from '@/lib/ai/latexCloner';

export const maxDuration = 60;

// GET all resumes
export async function GET(request) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const { data, error } = await supabaseAdmin
      .from('resumes').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ resumes: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST upload resume
export async function POST(request) {
  const auth = verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const formData = await request.formData();
    const file = formData.get('resume');
    const title = formData.get('title') || file?.name || 'My Resume';

    if (!file) {
      return NextResponse.json({ error: 'Please upload a PDF or DOCX file.' }, { status: 400 });
    }

    console.log('[RESUME UPLOAD] File:', file.name, 'Type:', file.type, 'Size:', file.size);
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    console.log('[RESUME UPLOAD] Buffer length:', buffer.length);

    // Extract text
    let rawText = '';
    if (mimeType === 'application/pdf') {
      console.log('[RESUME UPLOAD] Parsing PDF...');
      try {
        const { parsePdf } = await import('@/lib/parsers');
        const data = await parsePdf(buffer);
        rawText = data.text || '';
        console.log('[RESUME UPLOAD] PDF parsed. Text length:', rawText.length, 'Pages:', data.numpages);
        if (rawText.length > 0) {
          console.log('[RESUME UPLOAD] First 200 chars:', rawText.substring(0, 200));
        }
      } catch (parseErr) {
        console.error('[RESUME UPLOAD] PDF parse FAILED:', parseErr.message, parseErr.stack);
      }
    } else if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) {
      console.log('[RESUME UPLOAD] Parsing DOCX...');
      try {
        const { parseDocx } = await import('@/lib/parsers');
        const result = await parseDocx(buffer);
        rawText = result.value || '';
        console.log('[RESUME UPLOAD] DOCX parsed. Text length:', rawText.length);
      } catch (parseErr) {
        console.error('[RESUME UPLOAD] DOCX parse FAILED:', parseErr.message);
      }
    } else {
      return NextResponse.json({ error: 'Only PDF and DOCX files are supported.' }, { status: 400 });
    }

    console.log('-------------------------------------------');
    console.log('[DEBUG] Raw Text Length:', rawText?.length);
    if (!rawText || rawText.trim().length === 0) {
      console.error('[RESUME UPLOAD] Text extraction failed - result is empty.');
      return NextResponse.json({ 
        error: 'We could not extract any text from this file. It might be an image-only PDF or a corrupted file. Please try a different version.' 
      }, { status: 422 });
    }
    console.log('[DEBUG] Is length > 20?', (rawText?.length > 20));
    console.log('-------------------------------------------');

    // AI structuring & LaTeX cloning
    let structuredData = null;
    let latexTemplateData = null;
    if (rawText.length > 20) {
      console.log('[RESUME UPLOAD] ENTERING AI BLOCK (Concurrent execution)');
      
      const [structRes, latexRes] = await Promise.allSettled([
         structureResume(rawText),
         cloneLatexTemplate(rawText)
      ]);

      if (structRes.status === 'fulfilled') {
        structuredData = structRes.value;
        console.log('[RESUME UPLOAD] Structuring succeeded. Name:', structuredData?.name);
      } else {
        console.error('[RESUME UPLOAD] Structuring FAILED:', structRes.reason);
      }

      if (latexRes.status === 'fulfilled') {
        latexTemplateData = latexRes.value;
        console.log('[RESUME UPLOAD] LaTeX cloning succeeded. Length:', latexTemplateData?.length);
      } else {
        console.error('[RESUME UPLOAD] LaTeX cloning FAILED:', latexRes.reason);
      }
    } else {
      console.warn('[RESUME UPLOAD] Raw text too short for AI structuring:', rawText.length, 'chars');
    }

    console.log('[RESUME UPLOAD] Final Status - Has Structured Data:', !!structuredData, 'Has LaTeX:', !!latexTemplateData);

    const { data: resume, error } = await supabaseAdmin
      .from('resumes')
      .insert({
        user_id: auth.user.id,
        title,
        raw_text: rawText,
        structured_data: structuredData,
        latex_template: latexTemplateData,
        file_type: mimeType.includes('pdf') ? 'pdf' : 'docx',
      })
      .select().single();

    if (error) throw new Error(error.message);
    
    // Auto-capture projects
    if (structuredData && structuredData.projects && Array.isArray(structuredData.projects)) {
      console.log(`[RESUME UPLOAD] Auto-capturing ${structuredData.projects.length} projects...`);
      for (const proj of structuredData.projects) {
        if (proj.name) {
          // Find project by name or if Name starts with existing name
          const { data: existing } = await supabaseAdmin
            .from('projects')
            .select('*')
            .eq('user_id', auth.user.id)
            .or(`name.ilike.${proj.name},name.ilike.${proj.name}%`)
            .limit(1)
            .maybeSingle();

          let projBullets = [];
          if (Array.isArray(proj.bullets)) projBullets = proj.bullets.map(String);
          else if (typeof proj.bullets === 'string') projBullets = [proj.bullets];
          
          let techStackArray = [];
          if (Array.isArray(proj.techStack)) techStackArray = proj.techStack.map(String);
          else if (typeof proj.techStack === 'string') techStackArray = proj.techStack.split(',').map(s=>s.trim()).filter(Boolean);

          let projFeatures = [];
          if (Array.isArray(proj.features)) projFeatures = proj.features.map(String);
          else if (typeof proj.features === 'string') projFeatures = proj.features.split(',').map(s=>s.trim()).filter(Boolean);

          if (!existing) {
             const { error: insertErr } = await supabaseAdmin.from('projects').insert({
               user_id: auth.user.id,
               name: proj.name,
               description: proj.description || '',
               url: proj.url || null,
               features: projFeatures,
               tech_stack: techStackArray,
               bullet_points: projBullets
             });
             if (insertErr) console.error('[RESUME UPLOAD] Auto-save error:', insertErr.message);
             else console.log(`[RESUME UPLOAD] Auto-saved project: ${proj.name}`);
          } else {
             console.log(`[RESUME UPLOAD] Project ${proj.name} matches existing: ${existing.name}. Updating details...`);
             // Update if existing is missing URL or has shorter description
             const updatePayload = {};
             if (!existing.url && proj.url) updatePayload.url = proj.url;
             if ((!existing.description || existing.description.length < (proj.description?.length || 0)) && proj.description) {
               updatePayload.description = proj.description;
             }
             // Merge tech stack
             const mergedTech = Array.from(new Set([...(existing.tech_stack || []), ...techStackArray]));
             if (mergedTech.length > (existing.tech_stack || []).length) updatePayload.tech_stack = mergedTech;

             if (Object.keys(updatePayload).length > 0) {
               await supabaseAdmin.from('projects').update(updatePayload).eq('id', existing.id);
               console.log(`[RESUME UPLOAD] Updated project ${existing.name} with new details.`);
             }
          }
        }
      }
    }

    console.log('[RESUME UPLOAD] Saved to DB. ID:', resume.id, 'raw_text length:', rawText.length, 'has structured_data:', !!structuredData);
    return NextResponse.json({ resume }, { status: 201 });
  } catch (err) {
    console.error('[RESUME UPLOAD] FATAL ERROR:', err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

