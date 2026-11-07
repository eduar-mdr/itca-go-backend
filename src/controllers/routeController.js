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

const subscribeToRoute = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const route = await Route.findById(req.params.id);

    if (!route) {
      return response.error(res, 'Ruta no encontrada', 404);
    }

    if (!route.active) {
      return response.error(res, 'No puedes suscribirte a una ruta inactiva', 400);
    }

    if (route.subscribers.some(s => s.equals(userId))) {
      return response.error(res, 'Ya estás suscrito a esta ruta', 400);
    }

    route.subscribers.push(userId);
    await route.save();

    if (route.hasActiveChat) {
      await firebaseService.notifyActiveChatOnSubscription(userId, route.name);
    }

    response.success(res, route, 'Suscripción a la ruta exitosa');
  } catch (err) {
    next(err);
  }
};

const addRouteComment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return response.error(res, 'El texto del comentario es obligatorio', 400);
    }

    const route = await Route.findById(req.params.id);

    if (!route) {
      return response.error(res, 'Ruta no encontrada', 404);
    }

    const isSubscriber = route.subscribers.some(s => s.equals(userId));
    const isDriver = route.assignedDriver && route.assignedDriver.equals(userId);

    if (!isSubscriber && !isDriver) {
      return response.error(res, 'Solo los suscriptores o el conductor pueden comentar en esta ruta', 403);
    }

    route.comments.push({ author: userId, text: text.trim() });

    const isFirstComment = !route.hasActiveChat;
    if (isFirstComment) {
      route.hasActiveChat = true;
    }

    await route.save();

    await firebaseService.pushCommentToRTDB('route', route._id, {
      authorName: req.user.name,
      text: text.trim()
    });

    if (isFirstComment) {
      await firebaseService.notifyFirstComment(
        route._id,
        'route',
        route.name,
        route.subscribers
      );
    }

    const populated = await Route.findById(route._id)
      .populate('comments.author', 'name email');

    response.success(res, populated.comments, 'Comentario agregado exitosamente', 201);
  } catch (err) {
    next(err);
  }
};

const getRouteComments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const route = await Route.findById(req.params.id)
      .populate('comments.author', 'name email');

    if (!route) {
      return response.error(res, 'Ruta no encontrada', 404);
    }

    const isSubscriber = route.subscribers.some(s => s.equals(userId));
    const isDriver = route.assignedDriver && route.assignedDriver.equals(userId);

    if (!isSubscriber && !isDriver) {
      return response.error(res, 'Solo los suscriptores o el conductor pueden ver los comentarios', 403);
    }

    response.success(res, route.comments, 'Comentarios obtenidos exitosamente');
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
  deleteRoute,
  subscribeToRoute,
  addRouteComment,
  getRouteComments
};
