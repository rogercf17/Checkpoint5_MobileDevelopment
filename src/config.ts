// Valores públicos (não são segredos). Podem ser sobrescritos via .env (EXPO_PUBLIC_*)
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://checkpoint5-mobiledevelopment.onrender.com';
export const CLOUDINARY_CLOUD: string =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD ?? 'SEU_CLOUD_NAME';
export const CLOUDINARY_PRESET: string =
  process.env.EXPO_PUBLIC_CLOUDINARY_PRESET ?? 'SEU_UPLOAD_PRESET';