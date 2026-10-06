import { FirebaseError } from 'firebase/app';

const messages: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente de novo.',
  'permission-denied': 'Firestore recusou a gravação. Publique as regras do arquivo firestore.rules no Firebase Console.',
  'failed-precondition': 'O Firestore ainda não está configurado corretamente. Verifique se o banco foi criado no projeto Firebase.',
  'unavailable': 'Firestore indisponível. Verifique sua internet e tente novamente.',
  'auth/operation-not-allowed': 'Login por e-mail/senha não está habilitado no Firebase Console.',
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return messages[error.code] ?? `Ocorreu um erro (${error.code}). Tente novamente.`;
  }

  if (error instanceof Error && error.message) return error.message;
  return 'Ocorreu um erro. Tente novamente.';
}