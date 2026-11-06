const Route = require('../models/Route');
const response = require('../helpers/responseHandler');
const firebaseService = require('../services/firebaseService');

const getActiveRoutes = async (req, res, next) => {
  try {
    const routes = await Route.find({ active: true }).populate('assignedDriver', 'name email phone');
    response.success(res, routes, 'Rutas activas obtenidas exitosamente');
  } catch (err) {
    next(err);
  }
};

const getRouteById = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id).populate('assignedDriver', 'name email phone');

    if (!route) {
      return response.error(res, 'Ruta no encontrada', 404);
    }

    response.success(res, route, 'Ruta obtenida exitosamente');
  } catch (err) {
    next(err);
  }
};

const createRoute = async (req, res, next) => {
  try {
    const { name, description, origin, destination, active, originLocation, destinationLocation, schedule } = req.body;

    const route = await Route.create({
      name,
      description,
      origin,
      destination,
      active,
      originLocation,
      destinationLocation,
      currentLocation: originLocation,
      schedule,
      assignedDriver: req.user._id
    });

    response.success(res, route, 'Ruta creada exitosamente', 201);
  } catch (err) {
    next(err);
  }
};

const updateRoute = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return response.error(res, 'Ruta no encontrada', 404);
    }

    if (!route.assignedDriver || !route.assignedDriver.equals(req.user._id)) {
      return response.error(res, 'No tienes permiso para modificar esta ruta', 403);
    }

    const { name, description, origin, destination, active, originLocation, destinationLocation, schedule } = req.body;
    if (name !== undefined) route.name = name;
    if (description !== undefined) route.description = description;
    if (origin !== undefined) route.origin = origin;
    if (destination !== undefined) route.destination = destination;
    if (active !== undefined) route.active = active;
    if (originLocation !== undefined) route.originLocation = originLocation;
    if (destinationLocation !== undefined) route.destinationLocation = destinationLocation;
    if (schedule !== undefined) route.schedule = schedule;
    await route.save();

    if (req.body.active === false) {
      await firebaseService.sendPushNotification(
        `route_${route._id}`,
        'Ruta desactivada',
        `La ruta "${route.name}" ha sido desactivada`
      );
    }

    response.success(res, route, 'Ruta actualizada exitosamente');
  } catch (err) {
    next(err);
  }
};

const updateRouteLocation = async (req, res, next) => {
  try {
    const { coordinates } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return response.error(res, 'Coordenadas inválidas. Formato: [longitud, latitud]', 400);
    }

    const route = await Route.findById(req.params.id);

    if (!route) {
      return response.error(res, 'Ruta no encontrada', 404);
    }

    if (!route.assignedDriver || !route.assignedDriver.equals(req.user._id)) {
      return response.error(res, 'No tienes permiso para actualizar la ubicación de esta ruta', 403);
    }

    route.currentLocation = { type: 'Point', coordinates };
    await route.save();

    await firebaseService.updateRouteLocation(route._id, coordinates);

    response.success(res, route, 'Ubicación actual de ruta actualizada exitosamente');
  } catch (err) {
    next(err);
  }
};

const deleteRoute = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return response.error(res, 'Ruta no encontrada', 404);
    }

    if (!route.assignedDriver || !route.assignedDriver.equals(req.user._id)) {
      return response.error(res, 'No tienes permiso para eliminar esta ruta', 403);
    }

    route.active = false;
    await route.save();

    response.success(res, route, 'Ruta eliminada exitosamente');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getActiveRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  updateRouteLocation,
  deleteRoute
};
