import { useEffect, useState } from 'react';
import { getPublicUser } from '../services/chatService';
import type { PublicUser } from '../types/user';

// Carrega nome/foto dos integrantes e devolve um mapa uid -> usuário
export function useMemberProfiles(ids: string[]): Record<string, PublicUser> {
  const [profiles, setProfiles] = useState<Record<string, PublicUser>>({});
  const key = ids.join(',');

  useEffect(() => {
    if (!key) {
      setProfiles({});
      return undefined;
    }
    let active = true;
    void Promise.all(key.split(',').map((id) => getPublicUser(id)))
      .then((list) => {
        if (!active) return;
        const map: Record<string, PublicUser> = {};
        list.forEach((u) => {
          if (u) map[u.id] = u;
        });
        setProfiles(map);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [key]);

  return profiles;
}