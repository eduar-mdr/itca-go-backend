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

const createTrip = async (req, res, next) => {
  try {
    const { route, origin, destination, departureTime, totalSeats, simulatedPrice } = req.body;

    const trip = await Trip.create({
      driver: req.user._id,
      route,
      origin,
      destination,
      departureTime,
      totalSeats,
      availableSeats: totalSeats,
      simulatedPrice
    });

    await firebaseService.updateTripStatus(trip._id, 'available', {
      driver: req.user.name,
      origin,
      destination,
      departureTime,
      totalSeats,
      availableSeats: totalSeats
    });

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

      await firebaseService.updateTripStatus(trip._id, 'full', {
        availableSeats: 0
      });

      await firebaseService.sendPushNotification(
        `trip_${trip._id}`,
        'Viaje lleno',
        `El viaje de ${trip.origin} a ${trip.destination} ha alcanzado su cupo máximo`
      );
    } else {
      await firebaseService.updateTripStatus(trip._id, trip.status, {
        availableSeats: trip.availableSeats
      });
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

    await firebaseService.updateTripStatus(trip._id, status, {
      availableSeats: trip.availableSeats
    });

    const statusLabels = {
      in_progress: 'en proceso',
      completed: 'completado',
      cancelled: 'cancelado',
      delayed: 'retrasado'
    };

    await firebaseService.sendPushNotification(
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

module.exports = {
  getAvailableTrips,
  createTrip,
  requestSeat,
  updateTripStatus,
  deleteTrip
};
