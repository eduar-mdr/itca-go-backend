const NODE_ID = process.env.NODE_ID || 'Node-Local';

const errorHandler = (err, req, res, _next) => {
  console.error(`[${NODE_ID}] Error:`, err.message);

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    nodeId: NODE_ID
  });
};

module.exports = errorHandler;
