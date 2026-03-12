import fs from 'fs';
import path from 'path';

/**
 * Replaces simple tags like <<NAME>>
 */
function replaceTag(template, tag, value) {
  // Use brackets syntax: [TAG]
  // Because [] are special characters in regex, we escape them
  const regex = new RegExp(`\\[${tag}\\]`, 'g');
  return template.replace(regex, value || '');
}

/**
 * Replaces section blocks like <<#EXPERIENCE>> ... <</EXPERIENCE>>
 * If data exists and is an array of length > 0, keeps the block and replaces inner content
 * If no data, removes the entire block and its contents
 */
function replaceSection(template, tag, data, renderFn) {
  const startTag = `<<#${tag}>>`;
  const endTag = `<</${tag}>>`;
  
  const startIndex = template.indexOf(startTag);
  const endIndex = template.indexOf(endTag);
  
  if (startIndex === -1 || endIndex === -1) return template;
  
  const before = template.substring(0, startIndex);
  const after = template.substring(endIndex + endTag.length);
  const blockContent = template.substring(startIndex + startTag.length, endIndex);
  
  if (!data || (Array.isArray(data) && data.length === 0)) {
    // Return without the block
    return before + after;
  }
  
  // Render the inner content using the provided function
  const renderedContent = renderFn(blockContent, data);
  
  return before + renderedContent + after;
}

/**
 * Escapes characters for LaTeX
 */
function escapeLatex(text) {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\textbackslash ')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde ')
    .replace(/\^/g, '\\textasciicircum ');
}

/**
 * Generates LaTeX content from tailored data
 */
export function generateLatexRaw(tailoredData, masterLatexTemplate = null) {
  let template = '';
  
  if (masterLatexTemplate && masterLatexTemplate.trim().length > 0) {
    template = masterLatexTemplate;
    
    // Check if this is the "EXACT LaTeX" format (without placeholders)
    // If it doesn't contain basic placeholders like [USER-NAME] or [EXPERIENCE-START],
    // assume it's the exact generated code and just return it directly!
    if (!template.includes('[USER-NAME]') && !template.includes('[EXPERIENCE-START]')) {
       return template;
    }
  } else {
    const templatePath = path.join(process.cwd(), 'src/lib/templates/resume.tex');
    try {
      template = fs.readFileSync(templatePath, 'utf8');
      
      // The old hardcoded template still uses <<NAME>> tags. We will convert it on the fly 
      // to the new [TAG-NAME] format so the same replacement logic works for both!
      template = template
        .replace(/<<NAME>>/g, '[USER-NAME]')
        .replace(/<<EMAIL>>/g, '[USER-EMAIL]')
        .replace(/<<PHONE>>/g, '[USER-PHONE]')
        .replace(/<<LOCATION>>/g, '[USER-LOCATION]')
        .replace(/<<SUMMARY>>/g, '[USER-SUMMARY]')
        .replace(/<<SKILLS>>/g, '[SKILLS-LIST]')
        .replace(/<<#EXPERIENCE>>[\s\S]*?<<EXPERIENCE_ENTRIES>>[\s\S]*?<<\/EXPERIENCE>>/g, '[EXPERIENCE-START]\n[EXPERIENCE-ENTRIES]\n[EXPERIENCE-END]')
        .replace(/<<#PROJECTS>>[\s\S]*?<<PROJECT_ENTRIES>>[\s\S]*?<<\/PROJECTS>>/g, '[PROJECTS-START]\n[PROJECT-ENTRIES]\n[PROJECTS-END]')
        .replace(/<<#EDUCATION>>[\s\S]*?<<EDUCATION_ENTRIES>>[\s\S]*?<<\/EDUCATION>>/g, '[EDUCATION-START]\n[EDUCATION-ENTRIES]\n[EDUCATION-END]');
        
    } catch (e) {
      throw new Error('Could not find fallback LaTeX template.');
    }
  }

  // 1. Basic details
  template = replaceTag(template, 'USER-NAME', escapeLatex(tailoredData.name || 'Your Name'));
  template = replaceTag(template, 'USER-EMAIL', escapeLatex(tailoredData.email || 'email@example.com'));
  template = replaceTag(template, 'USER-PHONE', escapeLatex(tailoredData.phone || ''));
  template = replaceTag(template, 'USER-LOCATION', escapeLatex(tailoredData.location || ''));
  template = replaceTag(template, 'USER-LINKS', escapeLatex(tailoredData.links?.join(' | ') || ''));

  // 2. Summary
  template = replaceTag(template, 'USER-SUMMARY', escapeLatex(tailoredData.summary || ''));

  // 3. Skills
  template = replaceTag(template, 'SKILLS-LIST', escapeLatex((tailoredData.skills || []).join(', ')));

  // 4. Experience Engine (Replacing the Experience Loop)
  const rawExperience = tailoredData.experience || [];
  const tailoredBullets = tailoredData.tailored_experience_bullets || [];
  let expLatexEntries = '';
  
  rawExperience.forEach((exp, idx) => {
    expLatexEntries += `\\textbf{${escapeLatex(exp.title)}} at ${escapeLatex(exp.company)} \\hfill ${escapeLatex(exp.duration)} \\\\\n`;
    const bulletsToUse = idx === 0 && tailoredBullets.length > 0 ? tailoredBullets : (exp.bullets || []);
    
    if (bulletsToUse.length > 0) {
      expLatexEntries += `\\begin{itemize}[leftmargin=*,itemsep=0pt]\n`;
      bulletsToUse.forEach(b => {
        expLatexEntries += `  \\item {${escapeLatex(b)}}\n`;
      });
      expLatexEntries += `\\end{itemize}\n\\vspace{4pt}\n`;
    }
  });
  
  // Cut out whatever the AI hallucinated inside the Experience Loop and inject our rigid LaTeX formatted items
  template = template.replace(/\[EXPERIENCE-START\]([\s\S]*?)\[EXPERIENCE-END\]/g, expLatexEntries);
  // Also support fallback `[EXPERIENCE-ENTRIES]` just in case
  template = template.replace(/\[EXPERIENCE-ENTRIES\]/g, expLatexEntries);

  // 5. Projects Engine
  let projLatexEntries = '';
  (tailoredData.selected_projects || tailoredData.projects || []).forEach(proj => {
    const nameLine = `\\textbf{${escapeLatex(proj.name)}}`;
    
    // Support both raw format and ATS-tailored format keys
    let joinedTechStack = '';
    if (Array.isArray(proj.tech_stack)) joinedTechStack = proj.tech_stack.join(', ');
    else if (typeof proj.techStack === 'string') joinedTechStack = proj.techStack;
    else if (Array.isArray(proj.techStack)) joinedTechStack = proj.techStack.join(', ');
    
    const techLine = joinedTechStack ? ` | \\textit{${escapeLatex(joinedTechStack)}}` : '';
    projLatexEntries += `${nameLine}${techLine} \\\\\n`;
    
    const bullets = proj.bullet_points || proj.bullets || [];
    if (bullets.length > 0) {
       projLatexEntries += `\\begin{itemize}[leftmargin=*,itemsep=0pt]\n`;
       bullets.forEach(b => {
         projLatexEntries += `  \\item {${escapeLatex(b)}}\n`;
       });
       projLatexEntries += `\\end{itemize}\n\\vspace{4pt}\n`;
    } else if (proj.description && typeof proj.description === 'string') {
       projLatexEntries += `\\begin{itemize}[leftmargin=*,itemsep=0pt]\n`;
       projLatexEntries += `  \\item {${escapeLatex(proj.description)}}\n`;
       projLatexEntries += `\\end{itemize}\n\\vspace{4pt}\n`;
    }
  });
  
  template = template.replace(/\[PROJECTS-START\]([\s\S]*?)\[PROJECTS-END\]/g, projLatexEntries);
  template = template.replace(/\[PROJECT-ENTRIES\]/g, projLatexEntries);


  // 6. Education Engine
  let eduLatexEntries = '';
  (tailoredData.education || []).forEach(edu => {
    eduLatexEntries += `\\textbf{${escapeLatex(edu.degree)}} ${edu.institution ? '— ' + escapeLatex(edu.institution) : ''} \\hfill ${escapeLatex(edu.year)} \\\\\n`;
  });
  
  template = template.replace(/\[EDUCATION-START\]([\s\S]*?)\[EDUCATION-END\]/g, eduLatexEntries);
  template = template.replace(/\[EDUCATION-ENTRIES\]/g, eduLatexEntries);

  // 7. Certifications Engine
  const certifications = tailoredData.certifications || [];
  let certLatex = '';
  if (certifications.length > 0) {
    certLatex = certifications.map(c => escapeLatex(c)).join(', ');
  }
  
  // Replace the old style section if it exists
  const certRegex = /<<#CERTIFICATIONS>>[\s\S]*?<<\/CERTIFICATIONS>>/g;
  if (certifications.length > 0) {
    template = template.replace(certRegex, `\\section{Certifications}\n${certLatex}`);
  } else {
    template = template.replace(certRegex, '');
  }

  // 8. FINAL CLEANUP: Remove any orphaned tags that didn't get replaced
  // This prevents LaTeX compilation errors if new fields are added to templates but not the generator
  template = template
    .replace(/<<#[A-Z_]+>>[\s\S]*?<<\/[A-Z_]+>>/g, '') // Remove empty sections
    .replace(/<<[A-Z_-]+>>/g, '') // Remove orphaned tags
    .replace(/\[[A-Z_-]+\]/g, ''); // Remove orphaned bracket tags

  return template;
}
