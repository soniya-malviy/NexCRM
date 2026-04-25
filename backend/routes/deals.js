const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const { getDeals, getDeal, createDeal, updateDeal, deleteDeal, addActivity } = require('../controllers/dealController');

router.use(auth);

router.get('/', getDeals);
router.get('/:id', getDeal);
router.post('/', validate(schemas.deal), createDeal);
router.put('/:id', validate(schemas.deal), updateDeal);
router.delete('/:id', deleteDeal);
router.post('/:id/activity', addActivity);

module.exports = router;