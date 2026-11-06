const { Router } = require('express');
const {
  getActiveRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  updateRouteLocation,
  deleteRoute
} = require('../controllers/routeController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const router = Router();

router.get('/active', getActiveRoutes);
router.get('/:id', getRouteById);
router.post('/', requireAuth, requireRole('driver'), createRoute);
router.put('/:id', requireAuth, requireRole('driver'), updateRoute);
router.patch('/:id/location', requireAuth, requireRole('driver'), updateRouteLocation);
router.delete('/:id', requireAuth, requireRole('driver'), deleteRoute);

module.exports = router;
