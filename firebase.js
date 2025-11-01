import { initializeApp } from "firebase/app";
// ✅ 1. Import สำหรับ React Native: จัดการการยืนยันตัวตนและการคงอยู่ของสถานะ
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'; 
// ✅ 2. Import AsyncStorage: จำเป็นเพื่อให้สถานะล็อกอินของผู้ใช้ไม่หายไป
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; 
import { getFirestore } from 'firebase/firestore'; // ⬅️ เพิ่ม Firestore สำหรับการบันทึกข้อมูล
import { getStorage } from 'firebase/storage'; // ⬅️ เพิ่ม Storage สำหรับการอัปโหลดไฟล์เสียง

// ------------------------------------------------------------------
// ✅ ข้อมูล Firebase Config ที่คุณให้มา (Project ID: voicereapp)
// ------------------------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyBF-A-pt1jWe5Ie5af3U_eLGD-mWkGSalY",
    authDomain: "voicereapp.firebaseapp.com",
    projectId: "voicereapp",
    storageBucket: "voicereapp.firebasestorage.app",
    messagingSenderId: "84809994501",
    appId: "1:84809994501:web:916f99fce9addaf0aaa76c",
    // ไม่จำเป็นต้องใช้ measurementId ในแอปพลิเคชันนี้
};

// 1. Initialize Firebase App
const app = initializeApp(firebaseConfig);

// 2. Initialize Auth: เปิดการคงอยู่ของสถานะด้วย AsyncStorage สำหรับ React Native
// การตั้งค่านี้จะทำให้ผู้ใช้ไม่ต้องล็อกอินซ้ำทุกครั้งที่เปิดแอป
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// 3. Initialize Firestore (Database)
const db = getFirestore(app);

// 4. Initialize Storage (Cloud Storage)
const storage = getStorage(app);

// Export Instances ที่จะนำไปใช้ในคอมโพเนนต์ต่างๆ
export { auth, db, storage, app };
