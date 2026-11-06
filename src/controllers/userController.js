const User = require('../models/User');
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

module.exports = { syncUser, getProfile };
