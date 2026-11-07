const { Router } = require('express');
const {
  getAvailableTrips,
  createTrip,
  requestSeat,
  updateTripStatus,
  deleteTrip,
  addTripComment,
  getTripComments
} = require('../controllers/tripController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = Router();

router.get('/', getAvailableTrips);
router.post('/', requireAuth, createTrip);
router.post('/:id/request', requireAuth, requestSeat);
router.patch('/:id/status', requireAuth, updateTripStatus);
router.delete('/:id', requireAuth, deleteTrip);

router.post('/:id/comments', requireAuth, addTripComment);
router.get('/:id/comments', requireAuth, getTripComments);

module.exports = router;
