const { supabaseAdmin } = require('../config/supabase');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { structureResume } = require('../ai/resumeStructurer');

/**
 * Parse file buffer to extract text.
 */
async function extractText(fileBuffer, mimeType) {
  if (mimeType === 'application/pdf') {
    const data = await pdfParse(fileBuffer);
    return data.text;
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  }

  throw Object.assign(new Error('Unsupported file type. Upload PDF or DOCX.'), { status: 400 });
}

/**
 * Upload and parse a resume.
 */
async function uploadResume(userId, file, title) {
  // Extract raw text from the file
  const rawText = await extractText(file.buffer, file.mimetype);

  // Use AI to structure the resume into JSON
  let structuredData = null;
  try {
    structuredData = await structureResume(rawText);
  } catch (err) {
    console.warn('AI resume structuring failed, storing raw text only:', err.message);
  }

  // Store in database
  const { data: resume, error } = await supabaseAdmin
    .from('resumes')
    .insert({
      user_id: userId,
      title: title || file.originalname || 'My Resume',
      raw_text: rawText,
      structured_data: structuredData,
      file_type: file.mimetype.includes('pdf') ? 'pdf' : 'docx',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return resume;
}

/**
 * Get all resumes for a user.
 */
async function getUserResumes(userId) {
  const { data, error } = await supabaseAdmin
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Get a single resume by ID (must belong to user).
 */
async function getResumeById(resumeId, userId) {
  const { data, error } = await supabaseAdmin
    .from('resumes')
    .select('*')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw Object.assign(new Error('Resume not found.'), { status: 404 });
  }
  return data;
}

/**
 * Delete a resume.
 */
async function deleteResume(resumeId, userId) {
  const { error } = await supabaseAdmin
    .from('resumes')
    .delete()
    .eq('id', resumeId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return { message: 'Resume deleted successfully.' };
}

module.exports = { uploadResume, getUserResumes, getResumeById, deleteResume };
