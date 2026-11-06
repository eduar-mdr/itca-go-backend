require('dotenv').config();
const { auth } = require('../config/firebase');

const API_KEY = process.env.FIREBASE_API_KEY;

const TEST_USERS = {
  driver: {
    email: 'driver.test@itca.edu.sv',
    password: 'Test123456',
    displayName: 'Conductor de Prueba'
  },
  student: {
    email: 'student.test@itca.edu.sv',
    password: 'Test123456',
    displayName: 'Estudiante de Prueba'
  }
};

async function signInWithPassword(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(`Firebase Auth REST: ${data.error.message}`);
  }
  return data;
}

async function getOrCreateUser(role) {
  const userData = TEST_USERS[role];
  if (!userData) {
    throw new Error(`Rol inválido. Usa: driver o student`);
  }

  let firebaseUser;
  try {
    firebaseUser = await auth.getUserByEmail(userData.email);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      firebaseUser = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName
      });
      console.log(`Usuario creado en Firebase Auth: ${userData.email}`);
    } else {
      throw err;
    }
  }

  const session = await signInWithPassword(userData.email, userData.password);

  return {
    uid: firebaseUser.uid,
    email: userData.email,
    idToken: session.idToken,
    refreshToken: session.refreshToken,
    expiresIn: session.expiresIn
  };
}

async function main() {
  if (!API_KEY || API_KEY === 'TU_WEB_API_KEY_AQUI') {
    console.error('Error: Configura FIREBASE_API_KEY en el archivo .env');
    console.error('Encuéntrala en: Firebase Console > Project Settings > General > Web API Key');
    process.exit(1);
  }

  const role = process.argv[2] || 'driver';
  console.log(`Obteniendo token para rol: ${role}...\n`);

  const result = await getOrCreateUser(role);

  console.log('=== Datos del usuario ===');
  console.log(`UID:   ${result.uid}`);
  console.log(`Email: ${result.email}`);
  console.log(`Expira en: ${result.expiresIn} segundos`);
  console.log('\n=== Token (copiar para Postman) ===\n');
  console.log(result.idToken);
  console.log('\n=== Siguiente paso ===');
  console.log('1. Copia el token de arriba');
  console.log('2. En Postman, pega el token en la variable "token"');
  console.log('3. Ejecuta POST /api/users/sync con el body:');
  console.log(`   { "name": "${TEST_USERS[role].displayName}", "role": "${role}" }`);
  console.log('4. Ahora puedes usar todos los endpoints autenticados');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
