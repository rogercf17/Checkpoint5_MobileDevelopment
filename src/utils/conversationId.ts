export const directConversationId = (a: string, b: string): string =>
  `direct_${[a, b].sort().join('_')}`;
