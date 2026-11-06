const { Router } = require('express');
const {
  getAvailableTrips,
  createTrip,
  requestSeat,
  updateTripStatus,
  deleteTrip
} = require('../controllers/tripController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = Router();

router.get('/', getAvailableTrips);
router.post('/', requireAuth, createTrip);
router.post('/:id/request', requireAuth, requestSeat);
router.patch('/:id/status', requireAuth, updateTripStatus);
router.delete('/:id', requireAuth, deleteTrip);

module.exports = router;
