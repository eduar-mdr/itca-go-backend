const NODE_ID = process.env.NODE_ID || 'Node-Local';

const success = (res, data = null, message = 'Operación exitosa', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    nodeId: NODE_ID
  });
};

const error = (res, message = 'Error del servidor', statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: details,
    nodeId: NODE_ID
  });
};

module.exports = { success, error };
