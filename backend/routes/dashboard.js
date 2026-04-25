const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middlewares/auth');
const { getDashboardStats } = require('../controllers/dashboardController');

router.use(auth);

router.get('/stats', getDashboardStats);

module.exports = router;