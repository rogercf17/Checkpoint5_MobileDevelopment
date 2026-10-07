import type { NotificationPolicy } from '../types/group';

export const POLICY_OPTIONS: { value: NotificationPolicy; label: string; description: string }[] = [
  { value: 'all_group_messages', label: 'Todas as mensagens', description: 'Todos os integrantes (menos quem enviou) são notificados.' },
  { value: 'mentioned_members', label: 'Somente citados', description: 'Só quem foi marcado na mensagem é notificado.' },
  { value: 'direct_messages_only', label: 'Somente diretas', description: 'Mensagens do grupo não notificam; conversas individuais sim.' },
  { value: 'disabled', label: 'Desativadas', description: 'Nenhuma mensagem do grupo gera notificação.' },
];

export const policyLabel = (p: NotificationPolicy): string =>
  POLICY_OPTIONS.find((o) => o.value === p)?.label ?? p;