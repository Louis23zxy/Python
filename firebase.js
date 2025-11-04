import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'; 
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; 
import { getFirestore } from 'firebase/firestore'; 
import { getStorage } from 'firebase/storage'; 
const firebaseConfig = {
    apiKey: "AIzaSyBF-A-pt1jWe5Ie5af3U_eLGD-mWkGSalY",
    authDomain: "voicereapp.firebaseapp.com",
    projectId: "voicereapp",
    storageBucket: "voicereapp.firebasestorage.app",
    messagingSenderId: "84809994501",
    appId: "1:84809994501:web:916f99fce9addaf0aaa76c",
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const db = getFirestore(app);
const storage = getStorage(app);
export { auth, db, storage, app };
