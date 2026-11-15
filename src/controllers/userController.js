const User = require('../models/User');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const response = require('../helpers/responseHandler');

const syncUser = async (req, res, next) => {
  try {
    const { uid, email } = req.firebaseUser;
    const { name, role, studentId, phone } = req.body;

    if (!name) {
      return response.error(res, 'El nombre es obligatorio', 400);
    }

    const existing = await User.findOne({ firebaseUid: uid });

    const userData = {
      firebaseUid: uid,
      name,
      email: email || req.body.email,
      role: existing ? existing.role : (role || 'student'),
      studentId,
      phone
    };

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      userData,
      { new: true, upsert: true, runValidators: true }
    );

    const isNew = !existing;
    const message = isNew ? 'Usuario registrado exitosamente' : 'Usuario sincronizado exitosamente';
    const statusCode = isNew ? 201 : 200;

    response.success(res, user, message, statusCode);
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    response.success(res, req.user, 'Perfil obtenido exitosamente');
  } catch (err) {
    next(err);
  }
};

const getMyRoutes = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const routes = await Route.find({
      $or: [
        { assignedDriver: userId },
        { subscribers: userId, active: true }
      ]
    })
      .populate('assignedDriver', 'name email phone')
      .sort({ createdAt: -1 });

    const data = routes.map((route) => {
      const obj = route.toObject();
      obj.relationship = route.assignedDriver && route.assignedDriver._id.equals(userId)
        ? 'owner'
        : 'subscribed';
      return obj;
    });

    response.success(res, data, 'Mis rutas obtenidas exitosamente');
  } catch (err) {
    next(err);
  }
};

const getMyTrips = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const trips = await Trip.find({
      $or: [
        { driver: userId },
        { passengers: userId }
      ]
    })
      .populate('driver', 'name email phone')
      .populate('passengers', 'name email')
      .populate('route', 'name origin destination')
      .sort({ departureTime: 1 });

    const data = trips.map((trip) => {
      const obj = trip.toObject();
      obj.relationship = trip.driver && trip.driver._id.equals(userId)
        ? 'owner'
        : 'passenger';
      return obj;
    });

    response.success(res, data, 'Mis viajes obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
};

module.exports = { syncUser, getProfile, getMyRoutes, getMyTrips };
