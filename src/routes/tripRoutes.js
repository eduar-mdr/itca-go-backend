const { Router } = require('express');
const {
  getAvailableTrips,
  getTripById,
  createTrip,
  updateTrip,
  requestSeat,
  cancelRequest,
  updateTripStatus,
  deleteTrip,
  addTripComment,
  getTripComments
} = require('../controllers/tripController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = Router();

router.get('/', getAvailableTrips);
router.get('/:id', getTripById);
router.post('/', requireAuth, createTrip);
router.put('/:id', requireAuth, updateTrip);
router.post('/:id/request', requireAuth, requestSeat);
router.post('/:id/cancel-request', requireAuth, cancelRequest);
router.patch('/:id/status', requireAuth, updateTripStatus);
router.delete('/:id', requireAuth, deleteTrip);

router.post('/:id/comments', requireAuth, addTripComment);
router.get('/:id/comments', requireAuth, getTripComments);

module.exports = router;
