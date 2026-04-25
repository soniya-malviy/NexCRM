const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const { getLeads, getLead, getActivities, createLead, updateLead, deleteLead, addNote } = require('../controllers/leadController');

// Public route for website landing page
router.post('/public', validate(schemas.lead), createLead);

router.use(auth);

router.get('/', getLeads);
router.get('/:id', getLead);
router.get('/:id/activities', getActivities);
router.post('/:id/notes', addNote);
router.post('/', validate(schemas.lead), createLead);
router.put('/:id', validate(schemas.leadUpdate), updateLead);
router.delete('/:id', deleteLead);

module.exports = router;