const jobService = require('../services/job.service');

async function create(req, res, next) {
  try {
    const { title, company, description, source_url } = req.body;
    const job = await jobService.createJob(req.user.id, { title, company, description, source_url });
    res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const jobs = await jobService.getUserJobs(req.user.id);
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const job = await jobService.getJobById(req.params.id, req.user.id);
    res.json({ job });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await jobService.deleteJob(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getAll, getOne, remove };
