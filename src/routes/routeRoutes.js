const { Router } = require('express');
const {
  getActiveRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  updateRouteLocation,
  deleteRoute,
  subscribeToRoute,
  addRouteComment,
  getRouteComments
} = require('../controllers/routeController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const router = Router();

router.get('/active', getActiveRoutes);
router.get('/:id', getRouteById);
router.post('/', requireAuth, requireRole('driver'), createRoute);
router.put('/:id', requireAuth, requireRole('driver'), updateRoute);
router.patch('/:id/location', requireAuth, requireRole('driver'), updateRouteLocation);
router.delete('/:id', requireAuth, requireRole('driver'), deleteRoute);

router.post('/:id/subscribe', requireAuth, subscribeToRoute);
router.post('/:id/comments', requireAuth, addRouteComment);
router.get('/:id/comments', requireAuth, getRouteComments);

module.exports = router;
