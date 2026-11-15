const { Router } = require('express');
const { syncUser, getProfile, getMyRoutes, getMyTrips } = require('../controllers/userController');
const { verifyToken, requireAuth } = require('../middlewares/authMiddleware');

const router = Router();

router.post('/sync', verifyToken, syncUser);
router.get('/profile', requireAuth, getProfile);
router.get('/my-routes', requireAuth, getMyRoutes);
router.get('/my-trips', requireAuth, getMyTrips);

module.exports = router;
