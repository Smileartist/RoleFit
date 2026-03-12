const applicationService = require('../services/application.service');

async function create(req, res, next) {
  try {
    const { job_id, tailored_resume_id, status, notes } = req.body;

    if (!job_id) {
      return res.status(400).json({ error: 'job_id is required.' });
    }

    const application = await applicationService.createApplication(req.user.id, {
      job_id, tailored_resume_id, status, notes,
    });

    res.status(201).json({ application });
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const applications = await applicationService.getUserApplications(req.user.id);
    res.json({ applications });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const application = await applicationService.updateApplication(req.params.id, req.user.id, req.body);
    res.json({ application });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await applicationService.deleteApplication(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getAll, update, remove };
