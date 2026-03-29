const router = require('express').Router();
const { register, login, logout } = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many login attempts, try again later' }
});

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);

module.exports = router;
