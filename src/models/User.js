const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  firebaseUid: {
    type: String,
    required: [true, 'El UID de Firebase es obligatorio'],
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: {
      values: ['student', 'driver'],
      message: 'El rol debe ser student o driver'
    },
    default: 'student'
  },
  studentId: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = model('User', userSchema);
