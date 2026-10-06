import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
    useMemo,
} from 'react';
import type { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { logout as logoutervice, observeAuth } from "../services/authService";
import type { PublicUser } from '../types/user';

type AuthContextValue = {
    user: User | null;
    publicUser: PublicUser | null;
    loading: boolean;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<PublicUser | null>(null);
    const [loading, setLoading] = useState(true);
    const uid = user?.uid;

    useEffect(
        () =>
            observeAuth((user) => {
                setUser(user);
                if (!user) setProfile(null);
                setLoading(false);
            }),
        [],
    );

    useEffect(() => {
        if (!uid) return undefined;
        return onSnapshot(doc(db, 'users', uid), (snap) => {
            setProfile(
                snap.exists() 
                    ? { id: snap.id, ...(snap.data() as Omit<PublicUser, 'id'>) } 
                    : null,
            );
        },

        () => setProfile(null),
        );
    }, [uid]);

    const value = useMemo<AuthContextValue>(
        () => ({ user, publicUser: profile, loading, logout: logoutervice }),
        [user, profile, loading],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
    return context;
}