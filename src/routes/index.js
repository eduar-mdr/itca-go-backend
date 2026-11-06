const { Router } = require('express');
const healthRoutes = require('./healthRoutes');
const userRoutes = require('./userRoutes');
const routeRoutes = require('./routeRoutes');
const tripRoutes = require('./tripRoutes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/users', userRoutes);
router.use('/routes', routeRoutes);
router.use('/trips', tripRoutes);

module.exports = router;
