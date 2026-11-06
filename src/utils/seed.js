require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Route = require('../models/Route');
const Trip = require('../models/Trip');

const users = [
  {
    firebaseUid: 'seed-driver-001',
    name: 'Carlos Mejía',
    email: 'carlos.mejia@itca.edu.sv',
    role: 'driver',
    studentId: '061501',
    phone: '7000-1001'
  },
  {
    firebaseUid: 'seed-driver-002',
    name: 'Ana López',
    email: 'ana.lopez@itca.edu.sv',
    role: 'driver',
    studentId: '061502',
    phone: '7000-1002'
  },
  {
    firebaseUid: 'seed-student-001',
    name: 'Roberto García',
    email: 'roberto.garcia@itca.edu.sv',
    role: 'student',
    studentId: '061601',
    phone: '7000-2001'
  },
  {
    firebaseUid: 'seed-student-002',
    name: 'María Hernández',
    email: 'maria.hernandez@itca.edu.sv',
    role: 'student',
    studentId: '061602',
    phone: '7000-2002'
  }
];

const seed = async () => {
  await connectDB();
  console.log('Limpiando datos existentes...');
  await User.deleteMany({});
  await Route.deleteMany({});
  await Trip.deleteMany({});

  console.log('Insertando usuarios...');
  const createdUsers = await User.insertMany(users);
  const driver1 = createdUsers[0];
  const driver2 = createdUsers[1];
  const student1 = createdUsers[2];
  const student2 = createdUsers[3];
  console.log(`  ${createdUsers.length} usuarios creados`);

  console.log('Insertando rutas...');
  const routes = [
    {
      name: 'Ruta 1 - Sede Central San Salvador',
      description: 'Recorrido desde el centro de San Salvador hasta la Sede Central ITCA-FEPADE',
      origin: 'Centro Histórico, San Salvador',
      destination: 'Sede Central ITCA-FEPADE, Santa Tecla',
      active: true,
      location: { type: 'Point', coordinates: [-89.2863, 13.6714] },
      schedule: ['06:00 AM', '06:30 AM', '12:00 PM', '05:00 PM', '05:30 PM'],
      assignedDriver: driver1._id
    },
    {
      name: 'Ruta 2 - Soyapango a Sede Central',
      description: 'Recorrido desde Soyapango hasta la Sede Central ITCA-FEPADE',
      origin: 'Soyapango, San Salvador',
      destination: 'Sede Central ITCA-FEPADE, Santa Tecla',
      active: true,
      location: { type: 'Point', coordinates: [-89.1500, 13.7167] },
      schedule: ['05:45 AM', '06:15 AM', '04:45 PM'],
      assignedDriver: driver2._id
    },
    {
      name: 'Ruta 3 - Regional Santa Ana',
      description: 'Recorrido interno de la Regional de Santa Ana',
      origin: 'Terminal de buses, Santa Ana',
      destination: 'ITCA-FEPADE Regional Santa Ana',
      active: true,
      location: { type: 'Point', coordinates: [-89.5597, 13.9946] },
      schedule: ['06:30 AM', '12:30 PM', '05:15 PM'],
      assignedDriver: driver1._id
    },
    {
      name: 'Ruta 4 - Nocturna Sede Central',
      description: 'Ruta nocturna para estudiantes de jornada nocturna',
      origin: 'Metrocentro, San Salvador',
      destination: 'Sede Central ITCA-FEPADE, Santa Tecla',
      active: false,
      location: { type: 'Point', coordinates: [-89.2340, 13.7000] },
      schedule: ['05:30 PM', '09:30 PM'],
      assignedDriver: driver2._id
    }
  ];
  const createdRoutes = await Route.insertMany(routes);
  console.log(`  ${createdRoutes.length} rutas creadas (${createdRoutes.filter(r => r.active).length} activas)`);

  console.log('Insertando viajes...');
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const trips = [
    {
      driver: driver1._id,
      route: createdRoutes[0]._id,
      origin: 'Centro Histórico, San Salvador',
      destination: 'Sede Central ITCA-FEPADE, Santa Tecla',
      departureTime: new Date(tomorrow.setHours(6, 30, 0, 0)),
      totalSeats: 4,
      availableSeats: 3,
      passengers: [student1._id],
      status: 'available',
      simulatedPrice: 1.50
    },
    {
      driver: driver2._id,
      route: createdRoutes[1]._id,
      origin: 'Soyapango, San Salvador',
      destination: 'Sede Central ITCA-FEPADE, Santa Tecla',
      departureTime: new Date(tomorrow.setHours(5, 45, 0, 0)),
      totalSeats: 3,
      availableSeats: 0,
      passengers: [student1._id, student2._id, driver1._id],
      status: 'full',
      simulatedPrice: 2.00
    },
    {
      driver: driver1._id,
      route: createdRoutes[0]._id,
      origin: 'Sede Central ITCA-FEPADE, Santa Tecla',
      destination: 'Centro Histórico, San Salvador',
      departureTime: new Date(dayAfter.setHours(17, 0, 0, 0)),
      totalSeats: 4,
      availableSeats: 4,
      passengers: [],
      status: 'available',
      simulatedPrice: 1.50
    }
  ];
  const createdTrips = await Trip.insertMany(trips);
  console.log(`  ${createdTrips.length} viajes creados`);

  console.log('\n--- Resumen ---');
  console.log(`Usuarios:  ${createdUsers.length} (${createdUsers.filter(u => u.role === 'driver').length} drivers, ${createdUsers.filter(u => u.role === 'student').length} students)`);
  console.log(`Rutas:     ${createdRoutes.length} (${createdRoutes.filter(r => r.active).length} activas)`);
  console.log(`Viajes:    ${createdTrips.length} (${createdTrips.filter(t => t.status === 'available').length} disponibles, ${createdTrips.filter(t => t.status === 'full').length} llenos)`);

  console.log('\n--- IDs para pruebas ---');
  console.log(`Driver 1:   ${driver1._id} (${driver1.name})`);
  console.log(`Driver 2:   ${driver2._id} (${driver2.name})`);
  console.log(`Student 1:  ${student1._id} (${student1.name})`);
  console.log(`Student 2:  ${student2._id} (${student2.name})`);
  console.log(`Ruta activa:    ${createdRoutes[0]._id} (${createdRoutes[0].name})`);
  console.log(`Ruta inactiva:  ${createdRoutes[3]._id} (${createdRoutes[3].name})`);
  console.log(`Viaje disponible: ${createdTrips[0]._id} (${createdTrips[0].availableSeats} cupos)`);
  console.log(`Viaje lleno:      ${createdTrips[1]._id}`);
  console.log(`Viaje vacío:      ${createdTrips[2]._id} (${createdTrips[2].availableSeats} cupos)`);

  await mongoose.disconnect();
  console.log('\nSeed completado exitosamente.');
};

seed().catch((err) => {
  console.error('Error en seed:', err.message);
  process.exit(1);
});
