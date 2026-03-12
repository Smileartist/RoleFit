const express = require('express');
const router = express.Router();
const tailorController = require('../controllers/tailor.controller');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.post('/', authenticate, aiLimiter, tailorController.tailor);
router.post('/score', authenticate, aiLimiter, tailorController.score);
router.post('/email', authenticate, aiLimiter, tailorController.email);
router.get('/', authenticate, tailorController.getAll);

module.exports = router;
