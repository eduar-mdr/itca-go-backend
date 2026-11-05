const { Schema, model } = require('mongoose');

const routeSchema = new Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la ruta es obligatorio'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true
  },
  origin: {
    type: String,
    required: [true, 'El origen es obligatorio'],
    trim: true
  },
  destination: {
    type: String,
    required: [true, 'El destino es obligatorio'],
    default: 'Sede ITCA-FEPADE',
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  schedule: {
    type: [String],
    default: []
  },
  assignedDriver: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

routeSchema.index({ location: '2dsphere' });

module.exports = model('Route', routeSchema);
