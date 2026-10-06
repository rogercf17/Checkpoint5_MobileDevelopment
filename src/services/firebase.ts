import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from "../../firebaseConfig.json";

const isFirst = getApps().length === 0;
const app = isFirst ? initializeApp(firebaseConfig) : getApp();

export const auth = isFirst
    ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
    : getAuth(app);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
export const rtdb = getDatabase(app);
