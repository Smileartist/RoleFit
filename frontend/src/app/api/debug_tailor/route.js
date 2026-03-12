import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import { scoreResume } from '@/lib/ai/atsScorer';
import fs from 'fs';

export async function POST(request) {
  const secret = request.headers.get('x-secret');
  if (secret !== 'debug123') {
    const auth = verifyAuth(request);
    if (auth.error) return auth.error;
  }

  try {
    const { resume_id, job_id } = await request.json();
    
    const { data: resume } = await supabaseAdmin.from('resumes').select('*').eq('id', resume_id).single();
    const { data: job } = await supabaseAdmin.from('jobs').select('*').eq('id', job_id).single();
    
    fs.appendFileSync('debug.log', `\n[DEBUG] Resume has structured data keys: ${resume.structured_data ? Object.keys(resume.structured_data) : 'none'}`);
    fs.appendFileSync('debug.log', `\n[DEBUG] Calling scoreResume...`);
    
    // Override console.log temporarily to capture what atsScorer does
    const oldLog = console.log;
    const oldWarn = console.warn;
    const oldErr = console.error;
    console.log = (...args) => fs.appendFileSync('debug.log', `\n[LOG] ` + args.join(' '));
    console.warn = (...args) => fs.appendFileSync('debug.log', `\n[WARN] ` + args.join(' '));
    console.error = (...args) => fs.appendFileSync('debug.log', `\n[ERR] ` + args.join(' '));
    
    let res;
    try {
      res = await scoreResume(resume.structured_data, job.description);
      fs.appendFileSync('debug.log', `\n[DEBUG] Score result: ` + JSON.stringify(res));
    } catch(e) {
      fs.appendFileSync('debug.log', `\n[DEBUG] Score error: ` + e.message + e.stack);
    }
    
    console.log = oldLog;
    console.warn = oldWarn;
    console.error = oldErr;
    
    return NextResponse.json({ success: true, result: res });
  } catch (err) {
    fs.appendFileSync('debug.log', `\n[DEBUG] Route error: ` + err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
