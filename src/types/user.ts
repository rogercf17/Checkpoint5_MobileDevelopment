export type PublicUser = {
    id: string;
    name: string;
    photoUrl: string;
    createdAt: number;
};

export type PrivateUser = {
    email: string;
    phone: string;
    birthDate: string;
};

export type ChatUser = PublicUser & Partial<PrivateUser>;