const { auth } = require('../config/firebase');
const User = require('../models/User');
const response = require('../helpers/responseHandler');

const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return response.error(res, 'Token de autenticación requerido', 401);
  }

  try {
    const token = header.split(' ')[1];
    const decoded = await auth.verifyIdToken(token);

    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      return response.error(res, 'Usuario no registrado en el sistema', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    return response.error(res, 'Token inválido o expirado', 401);
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return response.error(res, 'Autenticación requerida', 401);
    }

    if (!roles.includes(req.user.role)) {
      return response.error(res, `Acceso denegado. Se requiere rol: ${roles.join(' o ')}`, 403);
    }

    next();
  };
};

module.exports = { requireAuth, requireRole };
