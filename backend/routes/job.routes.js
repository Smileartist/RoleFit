const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, jobController.create);
router.get('/', authenticate, jobController.getAll);
router.get('/:id', authenticate, jobController.getOne);
router.delete('/:id', authenticate, jobController.remove);

module.exports = router;
