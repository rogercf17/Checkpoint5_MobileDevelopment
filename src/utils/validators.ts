export type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  birthDate: string;
  photoUri: string | null;
};

export type FormErrors = Partial<Record<keyof RegisterForm, string>>;

export const onlyDigits = (v: string): string => v.replace(/\D/g, '');

export function maskDate(v: string): string {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function isValidDate(v: string): boolean {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (!m) return false;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getTime() <= Date.now() &&
    year >= 1900
  );
}

export const isValidEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function validateRegister(f: RegisterForm): FormErrors {
  const e: FormErrors = {};
  if (!f.name.trim()) e.name = 'Informe seu nome.';
  if (!isValidEmail(f.email)) e.email = 'Informe um e-mail válido.';
  if (f.password.length < 6) e.password = 'A senha deve ter pelo menos 6 caracteres.';
  if (f.confirmPassword !== f.password) e.confirmPassword = 'As senhas não conferem.';
  const phone = onlyDigits(f.phone);
  if (phone.length < 10 || phone.length > 11) e.phone = 'Celular com DDD (10 ou 11 dígitos).';
  if (!isValidDate(f.birthDate)) e.birthDate = 'Data inválida (dd/mm/aaaa).';
  if (!f.photoUri) e.photoUri = 'Escolha uma foto de perfil.';
  return e;
}