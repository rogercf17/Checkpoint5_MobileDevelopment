import { useEffect, useState } from 'react';
import type { ChatGroup } from '../types/group';
import { listenGroup } from '../services/groupService';

export function useGroup(groupId: string | undefined) {
  const [group, setGroup] = useState<ChatGroup | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(groupId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setGroup(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setError(null);
    // retorna o unsubscribe: o listener é removido ao desmontar
    return listenGroup(
      groupId,
      (next) => {
        setGroup(next);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
  }, [groupId]);

  return { group, loading, error };
}