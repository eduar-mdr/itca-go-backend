const { Router } = require('express');
const { syncUser, getProfile } = require('../controllers/userController');
const { verifyToken, requireAuth } = require('../middlewares/authMiddleware');

const router = Router();

router.post('/sync', verifyToken, syncUser);
router.get('/profile', requireAuth, getProfile);

module.exports = router;
