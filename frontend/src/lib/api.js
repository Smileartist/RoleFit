const API_BASE = '/api';

/**
 * Get auth token from localStorage.
 */
function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('rolefit_token');
  }
  return null;
}

/**
 * Make an authenticated API request.
 */
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
  };

  // Don't set Content-Type for FormData (let browser set multipart boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// ==================== Auth ====================
export async function register(name, email, password) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  localStorage.setItem('rolefit_token', data.token);
  return data;
}

export async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('rolefit_token', data.token);
  return data;
}

export async function getMe() {
  return apiFetch('/auth/me');
}

export function logout() {
  localStorage.removeItem('rolefit_token');
}

export function isLoggedIn() {
  return !!getToken();
}

// ==================== Resumes ====================
export async function uploadResume(file, title) {
  const formData = new FormData();
  formData.append('resume', file);
  if (title) formData.append('title', title);
  return apiFetch('/resumes', { method: 'POST', body: formData });
}

export async function getResumes() {
  return apiFetch('/resumes');
}

export async function getResume(id) {
  return apiFetch(`/resumes/${id}`);
}

export async function generateOriginalLatex(resumeId, latexTemplate = null) {
  return apiFetch('/resumes/latex', {
    method: 'POST',
    body: JSON.stringify({ resume_id: resumeId, latex_template: latexTemplate }),
  });
}

export async function deleteResume(id) {
  return apiFetch(`/resumes/${id}`, { method: 'DELETE' });
}

// ==================== Projects ====================
export async function createProject(project) {
  return apiFetch('/projects', { method: 'POST', body: JSON.stringify(project) });
}

export async function getProjects() {
  return apiFetch('/projects');
}

export async function updateProject(id, updates) {
  return apiFetch(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
}

export async function deleteProject(id) {
  return apiFetch(`/projects/${id}`, { method: 'DELETE' });
}

// ==================== Jobs ====================
export async function createJob(job) {
  return apiFetch('/jobs', { method: 'POST', body: JSON.stringify(job) });
}

export async function getJobs() {
  return apiFetch('/jobs');
}

export async function getJob(id) {
  return apiFetch(`/jobs/${id}`);
}

export async function deleteJob(id) {
  return apiFetch(`/jobs/${id}`, { method: 'DELETE' });
}

// ==================== Tailoring ====================
export async function tailorResume(resumeId, jobId, force = false) {
  return apiFetch('/tailor', {
    method: 'POST',
    body: JSON.stringify({ resume_id: resumeId, job_id: jobId, force }),
  });
}

export async function getAtsScore(resumeId, jobId) {
  return apiFetch('/tailor/score', {
    method: 'POST',
    body: JSON.stringify({ resume_id: resumeId, job_id: jobId }),
  });
}

export async function generateEmail(resumeId, jobId) {
  return apiFetch('/tailor/email', {
    method: 'POST',
    body: JSON.stringify({ resume_id: resumeId, job_id: jobId }),
  });
}

export async function getTailoredResumes() {
  return apiFetch('/tailor');
}

export async function generatePdf(tailoredId, useOriginal = false) {
  return apiFetch('/tailor/pdf', {
    method: 'POST',
    body: JSON.stringify({ tailored_id: tailoredId, use_original: useOriginal }),
  });
}

export async function saveLatexContent(tailoredId, latexContent) {
  return apiFetch('/tailor/latex', {
    method: 'PUT',
    body: JSON.stringify({ tailored_id: tailoredId, latex_content: latexContent }),
  });
}

export async function deleteTailoredResume(id) {
  return apiFetch(`/tailor?id=${id}`, { method: 'DELETE' });
}

// ==================== Applications ====================
export async function createApplication(appData) {
  return apiFetch('/applications', { method: 'POST', body: JSON.stringify(appData) });
}

export async function getApplications() {
  return apiFetch('/applications');
}

export async function updateApplication(id, updates) {
  return apiFetch(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
}

export async function deleteApplication(id) {
  return apiFetch(`/applications/${id}`, { method: 'DELETE' });
}
