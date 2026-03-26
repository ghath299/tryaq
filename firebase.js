import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // أضفنا هذا السطر للتعامل مع المواعيد

const firebaseConfig = {
  apiKey: "AIzaSyBD2_B1RRQ7RSeTXYjhsUd-314juYMkOaI",
  authDomain: "ghath-c86ae.firebaseapp.com",
  databaseURL: "https://ghath-c86ae-default-rtdb.firebaseio.com",
  projectId: "ghath-c86ae",
  storageBucket: "ghath-c86ae.firebasestorage.app",
  messagingSenderId: "309047121444",
  appId: "1:309047121444:web:392d4dd79b25d8d5276ab1",
  measurementId: "G-ZQJ06GT48K"
};

// تشغيل الفايربيس
const app = initializeApp(firebaseConfig);

// تصدير قاعدة البيانات لاستخدامها في صفحات الحجز
export const db = getDatabase(app);