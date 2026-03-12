import fs from 'fs';
import path from 'path';

/**
 * Replaces tags like <<TAG>> or [TAG]
 */
function replaceTag(template, tag, value) {
  const baseTag = tag.replace('USER-', '').replace('-LIST', '');
  const escapedTag = tag.replace('[', '\\[').replace(']', '\\]');
  // Match [TAG] or <<TAG>> (case-insensitive)
  const regex = new RegExp(`${escapedTag}|<<${baseTag}>>`, 'gi');
  return template.replace(regex, value || '');
}

/**
 * Replaces section blocks like <<#TAG>>...<</TAG>>
 */
function replaceSection(template, tag, data, renderFn) {
  const baseTag = tag.replace('USER-', '').replace('-LIST', '');
  // Match <<#TAG>>...<</TAG>> (case-insensitive)
  const regex = new RegExp(`<<#${baseTag}>>([\\s\\S]*?)<<\\/${baseTag}>>`, 'gi');
  
  return template.replace(regex, (match, blockContent) => {
    // If no data, remove the entire section
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return '';
    }
    // Render the block with the data
    return renderFn(blockContent, data);
  });
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
    // We check for both bracket style [USER-NAME] and legacy style <<NAME>>
    const hasPlaceholders = 
      template.includes('[USER-NAME]') || 
      template.includes('[EXPERIENCE-START]') ||
      template.includes('<<NAME>>') ||
      template.includes('<<#EXPERIENCE>>');

    if (!hasPlaceholders) {
       return template;
    }
  } else {
    const templatePath = path.join(process.cwd(), 'src/lib/templates/resume.tex');
    try {
      template = fs.readFileSync(templatePath, 'utf8');
    } catch (e) {
      throw new Error('Could not find fallback LaTeX template.');
    }
  }

  // 1. Basic details (Header)
  template = replaceTag(template, 'USER-NAME', escapeLatex(tailoredData.name || 'Your Name'));
  template = replaceTag(template, 'USER-EMAIL', escapeLatex(tailoredData.email || 'email@example.com'));
  template = replaceTag(template, 'USER-PHONE', escapeLatex(tailoredData.phone || ''));
  template = replaceTag(template, 'USER-LOCATION', escapeLatex(tailoredData.location || ''));
  template = replaceTag(template, 'USER-LINKS', escapeLatex(tailoredData.links?.join(' | ') || ''));

  // 2. Summary
  template = replaceSection(template, 'SUMMARY', tailoredData.summary, (block, data) => {
    return block.replace(/\[USER-SUMMARY\]|<<SUMMARY>>/g, escapeLatex(data));
  });

  // 3. Skills
  template = replaceSection(template, 'SKILLS', tailoredData.skills, (block, data) => {
    const skillsList = Array.isArray(data) ? data.join(', ') : data;
    return block.replace(/\[SKILLS-LIST\]|<<SKILLS>>/g, escapeLatex(skillsList));
  });

  // 4. Experience Engine
  template = replaceSection(template, 'EXPERIENCE', tailoredData.experience, (block, data) => {
    const tailoredBullets = tailoredData.tailored_experience_bullets || [];
    let entries = '';
    data.forEach((exp, idx) => {
      entries += `\\textbf{${escapeLatex(exp.title)}} at ${escapeLatex(exp.company)} \\hfill ${escapeLatex(exp.duration)} \\\\\n`;
      const bulletsToUse = idx === 0 && tailoredBullets.length > 0 ? tailoredBullets : (exp.bullets || []);
      if (bulletsToUse.length > 0) {
        entries += `\\begin{itemize}[leftmargin=*,itemsep=0pt]\n`;
        bulletsToUse.forEach(b => entries += `  \\item {${escapeLatex(b)}}\n`);
        entries += `\\end{itemize}\n\\vspace{4pt}\n`;
      }
    });
    return block.replace(/\[EXPERIENCE-ENTRIES\]|<<EXPERIENCE_ENTRIES>>/gi, entries);
  });

  // 5. Projects Engine
  const projects = (tailoredData.selected_projects || tailoredData.projects || []);
  template = replaceSection(template, 'PROJECTS', projects, (block, data) => {
    let entries = '';
    data.forEach(proj => {
      const nameLine = `\\textbf{${escapeLatex(proj.name)}}`;
      let joinedTechStack = '';
      if (Array.isArray(proj.tech_stack)) joinedTechStack = proj.tech_stack.join(', ');
      else if (typeof proj.techStack === 'string') joinedTechStack = proj.techStack;
      else if (Array.isArray(proj.techStack)) joinedTechStack = proj.techStack.join(', ');
      
      const techLine = joinedTechStack ? ` | \\textit{${escapeLatex(joinedTechStack)}}` : '';
      entries += `${nameLine}${techLine} \\\\\n`;
      
      const bullets = proj.bullet_points || proj.bullets || [];
      if (bullets.length > 0) {
         entries += `\\begin{itemize}[leftmargin=*,itemsep=0pt]\n`;
         bullets.forEach(b => entries += `  \\item {${escapeLatex(b)}}\n`);
         entries += `\\end{itemize}\n\\vspace{4pt}\n`;
      }
    });
    return block.replace(/\[PROJECT-ENTRIES\]|<<PROJECT_ENTRIES>>/gi, entries);
  });

  // 6. Education Engine
  template = replaceSection(template, 'EDUCATION', tailoredData.education, (block, data) => {
    let entries = '';
    const eduList = Array.isArray(data) ? data : [];
    eduList.forEach(edu => {
      entries += `\\textbf{${escapeLatex(edu.degree)}} ${edu.institution ? '— ' + escapeLatex(edu.institution) : ''} \\hfill ${escapeLatex(edu.year)} \\\\\n`;
    });
    return block.replace(/\[EDUCATION-ENTRIES\]|<<EDUCATION_ENTRIES>>/gi, entries);
  });

  // 7. Certifications Engine
  template = replaceSection(template, 'CERTIFICATIONS', tailoredData.certifications, (block, data) => {
    const certList = Array.isArray(data) ? data.map(c => escapeLatex(c)).join(', ') : escapeLatex(data || '');
    return block.replace(/\[CERTIFICATIONS-LIST\]|<<CERTIFICATIONS>>/gi, certList);
  });

  // 8. FINAL CLEANUP: Remove any remaining tags
  return template
    .replace(/<<#[A-Z_]+>>/gi, '') 
    .replace(/<<\/[A-Z_]+>>/gi, '') 
    .replace(/<<[A-Z_-]+>>/gi, '') 
    .replace(/\[[A-Z_-]+\]/gi, ''); 
}
