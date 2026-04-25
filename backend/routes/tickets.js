const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const {
  getAllTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  addMessage
} = require('../controllers/ticketController');

router.use(auth);

router.get('/', getAllTickets);
router.get('/:id', getTicket);
router.post('/', createTicket);
router.put('/:id', updateTicket);
router.post('/:id/messages', addMessage);
router.delete('/:id', deleteTicket);

module.exports = router;
