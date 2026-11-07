const { Schema, model } = require('mongoose');

const commentSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El autor del comentario es obligatorio']
  },
  text: {
    type: String,
    required: [true, 'El texto del comentario es obligatorio'],
    trim: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

const tripSchema = new Schema({
  driver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El conductor es obligatorio']
  },
  route: {
    type: Schema.Types.ObjectId,
    ref: 'Route'
  },
  origin: {
    type: String,
    required: [true, 'El origen es obligatorio'],
    trim: true
  },
  destination: {
    type: String,
    required: [true, 'El destino es obligatorio'],
    trim: true
  },
  departureTime: {
    type: Date,
    required: [true, 'La fecha y hora de salida es obligatoria']
  },
  totalSeats: {
    type: Number,
    required: [true, 'El cupo total es obligatorio'],
    min: [1, 'El cupo mínimo es 1']
  },
  availableSeats: {
    type: Number,
    required: [true, 'El cupo disponible es obligatorio'],
    min: [0, 'El cupo disponible no puede ser negativo']
  },
  passengers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: {
      values: ['available', 'full', 'in_progress', 'completed', 'cancelled', 'delayed'],
      message: 'Estado no válido'
    },
    default: 'available'
  },
  simulatedPrice: {
    type: Number,
    default: 0.00
  },
  hasActiveChat: {
    type: Boolean,
    default: false
  },
  comments: [commentSchema]
}, {
  timestamps: true
});

tripSchema.index({ status: 1, availableSeats: 1 });

module.exports = model('Trip', tripSchema);
