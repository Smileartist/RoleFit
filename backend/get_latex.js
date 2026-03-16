const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env from root
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data, error } = await supabaseAdmin
    .from('tailored_resumes')
    .select('latex_content, tailored_data')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  const latex = data.latex_content || 'NO LATEX CONTENT';
  fs.writeFileSync(path.join(__dirname, 'tailored_resume_debug.tex'), latex);
  console.log('Saved to tailored_resume_debug.tex');
  console.log('Tailored Data Keys:', Object.keys(data.tailored_data || {}));
}

run();
