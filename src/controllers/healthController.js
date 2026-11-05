const response = require('../helpers/responseHandler');

const getHealth = (req, res) => {
  response.success(res, {
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  }, 'ITCA Go Backend activo');
};

module.exports = { getHealth };
