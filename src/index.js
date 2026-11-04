const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Endpoint de salud / prueba R4
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'ITCA Go Backend Node activo',
    nodeId: process.env.NODE_ID || 'Node-Local' 
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});