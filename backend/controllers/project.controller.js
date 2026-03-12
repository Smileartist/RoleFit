const projectService = require('../services/project.service');

async function create(req, res, next) {
  try {
    const { name, description, tech_stack, features, bullet_points, url } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    const project = await projectService.createProject(req.user.id, {
      name, description, tech_stack, features, bullet_points, url,
    });

    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const projects = await projectService.getUserProjects(req.user.id);
    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user.id);
    res.json({ project });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const project = await projectService.updateProject(req.params.id, req.user.id, req.body);
    res.json({ project });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await projectService.deleteProject(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getAll, getOne, update, remove };
