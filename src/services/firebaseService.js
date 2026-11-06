const { admin, db } = require('../config/firebase');

const updateRouteLocation = async (routeId, coordinates) => {
  await db.ref(`routes/${routeId}/currentLocation`).set({
    coordinates,
    updatedAt: new Date().toISOString()
  });
};

const updateTripStatus = async (tripId, status, extra = {}) => {
  await db.ref(`trips/${tripId}`).update({
    status,
    ...extra,
    updatedAt: new Date().toISOString()
  });
};

const sendPushNotification = async (topic, title, body) => {
  try {
    await admin.messaging().send({
      topic,
      notification: { title, body }
    });
  } catch (err) {
    console.error('[FCM] Error enviando notificación:', err.message);
  }
};

module.exports = { updateRouteLocation, updateTripStatus, sendPushNotification };
