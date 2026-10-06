import {
    createUserWithEmailAndPassword,
    deleteUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    type User,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, updateDoc, writeBatch } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { uploadImage } from "./imageService";

export const DEVICE_ID_KEY = "pushDeviceId";

export type RegisterInput = {
    name: string;
    email: string;
    password: string;
    phone: string;
    birthDate: string;
    photoUri: string;
};

let registering = false;
let notify: ((u: User | null) => void) | null = null;
export async function register(input: RegisterInput): Promise<void> {
    registering = true;
    try {
        const photoUrl = await uploadImage(input.photoUri); // upload ANTES de criar o usuário
        const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
        const uid = cred.user.uid;
        try {
            const batch = writeBatch(db);
            batch.set(doc(db, 'users', uid), {
                name: input.name.trim(), photoUrl, createdAt: Date.now(),
            });
            batch.set(doc(db, 'userPrivate', uid), {
                email: input.email.trim(), phone: input.phone, birthDate: input.birthDate,
            });
            await batch.commit();
        } catch (error) {
            await deleteUser(cred.user).catch(() => signOut(auth).catch(() => undefined));
            throw error;
        }
        registering = false;
        notify?.(auth.currentUser);   
    } catch (error) {
        registering = false;
        throw error;                 
    }
}

export async function login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function logout(): Promise<void> {
    const uid = auth.currentUser?.uid;

    try {
        const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

        if (uid && deviceId) {
            await updateDoc(doc(db, `users/${uid}/devices/${deviceId}`), {
                enabled: false
            });
        }
    }
    catch (error) {

    }

    await signOut(auth);
}

export function observeAuth(callback: (user: User | null) => void): () => void {
    notify = callback;
    const unsub = onAuthStateChanged(auth, (u) => { if (!registering) callback(u); });
    return () => { unsub(); notify = null; };
}