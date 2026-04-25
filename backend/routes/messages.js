const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const { getChannels, createChannel, getMessages, sendMessage } = require('../controllers/messageController');

router.use(auth);

router.get('/channels', getChannels);
router.post('/channels', createChannel);
router.get('/messages', getMessages);
router.post('/messages', validate(schemas.message), sendMessage);

module.exports = router;