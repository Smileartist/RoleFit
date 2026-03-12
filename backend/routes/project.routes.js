const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, projectController.create);
router.get('/', authenticate, projectController.getAll);
router.get('/:id', authenticate, projectController.getOne);
router.put('/:id', authenticate, projectController.update);
router.delete('/:id', authenticate, projectController.remove);

module.exports = router;
