const { admin, db } = require('../config/firebase');
const User = require('../models/User');

const updateRouteLocation = async (routeId, coordinates) => {
  await db.ref(`routes/${routeId}/currentLocation`).set({
    coordinates,
    updatedAt: new Date().toISOString()
  });
};

const updateRouteData = async (routeId, data = {}) => {
  await db.ref(`routes/${routeId}`).update({
    ...data,
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

const pushCommentToRTDB = async (entityType, entityId, comment) => {
  await db.ref(`comments/${entityType}_${entityId}`).push({
    author: comment.authorName,
    text: comment.text,
    createdAt: new Date().toISOString()
  });
};

const notifyUsers = async (userIds, notification) => {
  if (!userIds || userIds.length === 0) return;

  const timestamp = new Date().toISOString();

  for (const userId of userIds) {
    db.ref(`notifications/${userId}`).push({
      title: notification.title,
      body: notification.body,
      type: notification.type,
      entityId: String(notification.entityId),
      createdAt: timestamp
    }).catch(err => console.error('[RTDB] Error writing notification:', err.message));
  }

  try {
    const users = await User.find(
      { _id: { $in: userIds }, fcmToken: { $exists: true, $ne: null } },
      'fcmToken'
    );
    for (const user of users) {
      admin.messaging().send({
        token: user.fcmToken,
        notification: { title: notification.title, body: notification.body },
        data: { type: notification.type, entityId: String(notification.entityId) }
      }).catch(err => console.error('[FCM] Error sending to device:', err.message));
    }
  } catch (err) {
    console.error('[FCM] Error fetching user tokens:', err.message);
  }
};

module.exports = {
  updateRouteLocation,
  updateRouteData,
  updateTripStatus,
  pushCommentToRTDB,
  notifyUsers
};
