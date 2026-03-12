const tailorService = require('../services/tailor.service');

async function tailor(req, res, next) {
  try {
    const { resume_id, job_id } = req.body;

    if (!resume_id || !job_id) {
      return res.status(400).json({ error: 'resume_id and job_id are required.' });
    }

    const tailored = await tailorService.tailorResume(req.user.id, resume_id, job_id);
    res.status(201).json({ tailored_resume: tailored });
  } catch (err) {
    next(err);
  }
}

async function score(req, res, next) {
  try {
    const { resume_id, job_id } = req.body;

    if (!resume_id || !job_id) {
      return res.status(400).json({ error: 'resume_id and job_id are required.' });
    }

    const atsResult = await tailorService.getAtsScore(req.user.id, resume_id, job_id);
    res.json({ ats: atsResult });
  } catch (err) {
    next(err);
  }
}

async function email(req, res, next) {
  try {
    const { resume_id, job_id } = req.body;

    if (!resume_id || !job_id) {
      return res.status(400).json({ error: 'resume_id and job_id are required.' });
    }

    const emailText = await tailorService.getApplicationEmail(req.user.id, resume_id, job_id);
    res.json({ email: emailText });
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const tailored = await tailorService.getTailoredResumes(req.user.id);
    res.json({ tailored_resumes: tailored });
  } catch (err) {
    next(err);
  }
}

module.exports = { tailor, score, email, getAll };
