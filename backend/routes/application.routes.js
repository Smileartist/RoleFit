const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/application.controller');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, applicationController.create);
router.get('/', authenticate, applicationController.getAll);
router.put('/:id', authenticate, applicationController.update);
router.delete('/:id', authenticate, applicationController.remove);

module.exports = router;
