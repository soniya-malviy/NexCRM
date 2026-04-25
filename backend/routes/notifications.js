const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notificationController');

router.use(auth);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;