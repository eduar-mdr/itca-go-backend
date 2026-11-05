const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db');
require('./config/firebase');
const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use('/api', apiRoutes);

app.use(errorHandler);

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[${process.env.NODE_ID || 'Node-Local'}] Servidor corriendo en puerto ${PORT}`);
  });
};

start().catch((err) => {
  console.error('Error al iniciar el servidor:', err.message);
  process.exit(1);
});
