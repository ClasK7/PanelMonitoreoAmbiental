import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Tus credenciales oficiales del proyecto Monitoreo-IoT-Avanzado
const firebaseConfig = {
  apiKey: import.meta.env.FIREBASE_AUT_API_KEY,
  authDomain: "monitoreo-iot-avanzado.firebaseapp.com",
  databaseURL: "https://monitoreo-iot-avanzado-default-rtdb.firebaseio.com",
  projectId: "monitoreo-iot-avanzado",
  storageBucket: "monitoreo-iot-avanzado.firebasestorage.app",
  messagingSenderId: "1098911100984",
  appId: "1:1098911100984:web:f18cc96d72786c2d4676cd",
  measurementId: "G-6QQ2W12RCD"
};

const app = initializeApp(firebaseConfig);

// Para correos y contraseñas
export const auth = getAuth(app);

//Para el botón "Continuar con Google"
export const googleProvider = new GoogleAuthProvider();