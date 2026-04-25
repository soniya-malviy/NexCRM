const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middlewares/validation');
const { auth, adminOnly } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimit');
const authController = require('../controllers/authController');

router.post('/register', adminOnly, validate(schemas.register), authController.register);
router.post('/login', authLimiter, validate(schemas.login), authController.login);
router.get('/me', auth, authController.getMe);
router.get('/users', auth, authController.getAllUsers);
router.post('/register-staff', auth, adminOnly, authController.registerStaff);

module.exports = router;