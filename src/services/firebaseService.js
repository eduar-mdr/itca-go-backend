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

const pushCommentToRTDB = async (entityType, entityId, comment) => {
  await db.ref(`comments/${entityType}_${entityId}`).push({
    author: comment.authorName,
    text: comment.text,
    createdAt: new Date().toISOString()
  });
};

const notifyFirstComment = async (entityId, entityType, entityName, targetUserIds) => {
  const typeLabel = entityType === 'route' ? 'ruta' : 'viaje';

  await sendPushNotification(
    `${entityType}_${entityId}`,
    'Nuevo diálogo iniciado',
    `Se ha iniciado una sección de comentarios en la ${typeLabel} "${entityName}"`
  );
};

const notifyActiveChatOnSubscription = async (userId, entityName) => {
  try {
    await admin.messaging().send({
      topic: `user_${userId}`,
      notification: {
        title: 'Diálogo en curso',
        body: `La ruta "${entityName}" tiene un diálogo activo`
      }
    });
  } catch (err) {
    console.error('[FCM] Error notificando chat activo:', err.message);
  }
};

module.exports = {
  updateRouteLocation,
  updateTripStatus,
  sendPushNotification,
  pushCommentToRTDB,
  notifyFirstComment,
  notifyActiveChatOnSubscription
};
