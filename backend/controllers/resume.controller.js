const resumeService = require('../services/resume.service');

async function upload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF or DOCX file.' });
    }

    const resume = await resumeService.uploadResume(
      req.user.id,
      req.file,
      req.body.title
    );

    res.status(201).json({ resume });
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const resumes = await resumeService.getUserResumes(req.user.id);
    res.json({ resumes });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const resume = await resumeService.getResumeById(req.params.id, req.user.id);
    res.json({ resume });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await resumeService.deleteResume(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, getAll, getOne, remove };
