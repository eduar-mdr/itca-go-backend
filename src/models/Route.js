const { Schema, model } = require('mongoose');

const geoPointSchema = {
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number],
    default: [0, 0]
  }
};

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
  originLocation: geoPointSchema,
  destinationLocation: geoPointSchema,
  currentLocation: geoPointSchema,
  schedule: {
    type: [String],
    default: []
  },
  assignedDriver: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  subscribers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  hasActiveChat: {
    type: Boolean,
    default: false
  },
  comments: [commentSchema]
}, {
  timestamps: true
});

routeSchema.index({ currentLocation: '2dsphere' });

module.exports = model('Route', routeSchema);
