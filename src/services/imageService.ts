import * as ImagePicker from 'expo-image-picker';
import { CLOUDINARY_CLOUD, CLOUDINARY_PRESET } from '../config';

export async function pickImage(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Permissão para acessar as fotos foi negada.');
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.4,
    base64: true,
  });
  if (res.canceled) return null;
  const asset = res.assets[0];
  if (!asset.base64) throw new Error('Não foi possível ler a imagem.');
  return `data:image/jpeg;base64,${asset.base64}`;
}

export async function uploadImage(dataUri: string): Promise<string> {
  if (CLOUDINARY_CLOUD === 'SEU_CLOUD_NAME' || CLOUDINARY_PRESET === 'SEU_UPLOAD_PRESET') {
    throw new Error('Configure EXPO_PUBLIC_CLOUDINARY_CLOUD e EXPO_PUBLIC_CLOUDINARY_PRESET antes de cadastrar.');
  }
  const form = new FormData();
  form.append('file', dataUri);
  form.append('upload_preset', CLOUDINARY_PRESET);
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', body: form });
  } catch (e) {
    throw new Error('Falha ao enviar a imagem: ' + String(e));
  }
  if (!res.ok) {
    throw new Error('Cloudinary recusou o envio: ' + (await res.text()));
  }
  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}