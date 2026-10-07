import { apiFetch } from './apiClient';

export type FullProfile = {
  id: string;
  name: string;
  photoUrl: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
};

export const getFullProfile = (uid: string) => apiFetch<FullProfile>(`/users/${uid}/profile`);