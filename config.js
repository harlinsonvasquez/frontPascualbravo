// Configuración web del proyecto Firebase existente.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAEpqL8eBYNaz20QrhCgyzJPNSYf0apOs4",
  authDomain: "base-datos-8eff6.firebaseapp.com",
  databaseURL: "https://base-datos-8eff6-default-rtdb.firebaseio.com/",
  projectId: "base-datos-8eff6",
  storageBucket: "base-datos-8eff6.firebasestorage.app",
  messagingSenderId: "539103681621",
  appId: "1:539103681621:web:cf4f12db6c5919bcab88dc"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
