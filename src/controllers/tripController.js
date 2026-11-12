const Trip = require('../models/Trip');
const response = require('../helpers/responseHandler');
const firebaseService = require('../services/firebaseService');

const getAvailableTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find({ status: 'available', availableSeats: { $gt: 0 } })
      .populate('driver', 'name email phone')
      .populate('route', 'name origin destination')
      .sort({ departureTime: 1 });

    response.success(res, trips, 'Viajes disponibles obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
};

const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('driver', 'name email phone')
      .populate('route', 'name origin destination')
      .populate('passengers', 'name email');

    if (!trip) {
      return response.error(res, 'Viaje no encontrado', 404);
    }

    response.success(res, trip, 'Viaje obtenido exitosamente');
  } catch (err) {
    next(err);
  }
};

const createTrip = async (req, res, next) => {
  try {
    const { route, origin, destination, originLocation, destinationLocation, departureTime, totalSeats, simulatedPrice } = req.body;

    const trip = await Trip.create({
      driver: req.user._id,
      route,
      origin,
      destination,
      originLocation,
      destinationLocation,
      departureTime,
      totalSeats,
      availableSeats: totalSeats,
      simulatedPrice
    });

    firebaseService.updateTripStatus(trip._id, 'available', {
      driver: req.user.name,
      origin,
      destination,
      departureTime,
      totalSeats,
      availableSeats: totalSeats
    }).catch(err => console.error('[RTDB] Error sync trip:', err.message));

    response.success(res, trip, 'Viaje creado exitosamente', 201);
  } catch (err) {
    next(err);
  }
};

const requestSeat = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const trip = await Trip.findOneAndUpdate(
      {
        _id: req.params.id,
        status: { $in: ['available'] },
        availableSeats: { $gt: 0 },
        passengers: { $ne: userId },
        driver: { $ne: userId }
      },
      {
        $inc: { availableSeats: -1 },
        $push: { passengers: userId }
      },
      { new: true }
    );

    if (!trip) {
      const existing = await Trip.findById(req.params.id);
      if (!existing) {
        return response.error(res, 'Viaje no encontrado', 404);
      }
      if (existing.driver.equals(userId)) {
        return response.error(res, 'No puedes reservar cupo en tu propio viaje', 400);
      }
      if (existing.passengers.some(p => p.equals(userId))) {
        return response.error(res, 'Ya tienes un cupo reservado en este viaje', 400);
      }
      if (existing.availableSeats <= 0) {
        return response.error(res, 'No hay cupos disponibles en este viaje', 400);
      }
      return response.error(res, 'No se pudo reservar el cupo', 400);
    }

    if (trip.availableSeats === 0) {
      trip.status = 'full';
      await trip.save();

      firebaseService.updateTripStatus(trip._id, 'full', {
        availableSeats: 0
      }).catch(err => console.error('[RTDB] Error sync trip:', err.message));

      firebaseService.sendPushNotification(
        `trip_${trip._id}`,
        'Viaje lleno',
        `El viaje de ${trip.origin} a ${trip.destination} ha alcanzado su cupo máximo`
      ).catch(err => console.error('[FCM] Error:', err.message));
    } else {
      firebaseService.updateTripStatus(trip._id, trip.status, {
        availableSeats: trip.availableSeats
      }).catch(err => console.error('[RTDB] Error sync trip:', err.message));
    }

    if (trip.hasActiveChat) {
      firebaseService.notifyActiveChatOnSubscription(
        userId,
        `${trip.origin} → ${trip.destination}`
      ).catch(err => console.error('[FCM] Error:', err.message));
    }

    response.success(res, trip, 'Cupo reservado exitosamente');
  } catch (err) {
    next(err);
  }
};

const updateTripStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['in_progress', 'completed', 'cancelled', 'delayed'];

    if (!status || !allowedStatuses.includes(status)) {
      return response.error(res, `Estado inválido. Valores permitidos: ${allowedStatuses.join(', ')}`, 400);
    }

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return response.error(res, 'Viaje no encontrado', 404);
    }

    if (!trip.driver.equals(req.user._id)) {
      return response.error(res, 'Solo el conductor creador puede cambiar el estado del viaje', 403);
    }

    trip.status = status;
    await trip.save();

    firebaseService.updateTripStatus(trip._id, status, {
      availableSeats: trip.availableSeats
    }).catch(err => console.error('[RTDB] Error sync trip:', err.message));

    const statusLabels = {
      in_progress: 'en proceso',
      completed: 'completado',
      cancelled: 'cancelado',
      delayed: 'retrasado'
    };

    firebaseService.sendPushNotification(
      `trip_${trip._id}`,
      'Actualización de viaje',
      `El viaje de ${trip.origin} a ${trip.destination} ahora está ${statusLabels[status]}`
    );

    response.success(res, trip, `Estado del viaje actualizado a "${statusLabels[status]}"`);
  } catch (err) {
    next(err);
  }
};

const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return response.error(res, 'Viaje no encontrado', 404);
    }

    if (!trip.driver.equals(req.user._id)) {
      return response.error(res, 'Solo el conductor creador puede eliminar este viaje', 403);
    }

    if (trip.status !== 'available') {
      return response.error(res, 'Solo se pueden eliminar viajes en estado "available"', 400);
    }

    await Trip.findByIdAndDelete(trip._id);

    response.success(res, null, 'Viaje eliminado exitosamente');
  } catch (err) {
    next(err);
  }
};

const addTripComment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return response.error(res, 'El texto del comentario es obligatorio', 400);
    }

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return response.error(res, 'Viaje no encontrado', 404);
    }

    const isPassenger = trip.passengers.some(p => p.equals(userId));
    const isDriver = trip.driver.equals(userId);

    if (!isPassenger && !isDriver) {
      return response.error(res, 'Solo los pasajeros o el conductor pueden comentar en este viaje', 403);
    }

    trip.comments.push({ author: userId, text: text.trim() });

    const isFirstComment = !trip.hasActiveChat;
    if (isFirstComment) {
      trip.hasActiveChat = true;
    }

    await trip.save();

    firebaseService.pushCommentToRTDB('trip', trip._id, {
      authorName: req.user.name,
      text: text.trim()
    }).catch(err => console.error('[RTDB] Error push comment:', err.message));

    if (isFirstComment) {
      firebaseService.notifyFirstComment(
        trip._id,
        'trip',
        `${trip.origin} → ${trip.destination}`,
        trip.passengers
      ).catch(err => console.error('[FCM] Error:', err.message));
    }

    const populated = await Trip.findById(trip._id)
      .populate('comments.author', 'name email');

    response.success(res, populated.comments, 'Comentario agregado exitosamente', 201);
  } catch (err) {
    next(err);
  }
};

const getTripComments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const trip = await Trip.findById(req.params.id)
      .populate('comments.author', 'name email');

    if (!trip) {
      return response.error(res, 'Viaje no encontrado', 404);
    }

    const isPassenger = trip.passengers.some(p => p.equals(userId));
    const isDriver = trip.driver.equals(userId);

    if (!isPassenger && !isDriver) {
      return response.error(res, 'Solo los pasajeros o el conductor pueden ver los comentarios', 403);
    }

    response.success(res, trip.comments, 'Comentarios obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAvailableTrips,
  getTripById,
  createTrip,
  requestSeat,
  updateTripStatus,
  deleteTrip,
  addTripComment,
  getTripComments
};
