import { useCallback, useEffect, useState } from 'react';
import type { ChatMessage, ConversationType, MessageTarget } from '../types/chat';
import { listenMessages, notifyMessage, sendMessage } from '../services/chatService';

type Params = {
  conversationId: string;
  conversationType: ConversationType;
  senderId: string;
};

export function useChat({ conversationId, conversationType, senderId }: Params) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendWarning, setSendWarning] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    return listenMessages(
      conversationId,
      (next) => {
        setMessages(next);
        setLoading(false);
      },
      (nextError) => {
        setError(nextError.message);
        setLoading(false);
      },
    );
  }, [conversationId]);

  const send = useCallback(
    async (text: string, target: MessageTarget = { type: 'conversation' }, mentionedUserIds: string[] = []) => {
      setSending(true);
      setSendWarning(null);
      try {
        const messageId = await sendMessage({
          conversationId,
          conversationType,
          senderId,
          text,
          target,
          mentionedUserIds,
        });

          try {
          await notifyMessage(conversationId, messageId);
        } catch {
          setSendWarning('Mensagem enviada, mas a notificação não pôde ser enviada.');
        }
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : 'Não foi possível enviar a mensagem.');
        throw nextError;
      } finally {
        setSending(false);
      }
    },
    [conversationId, conversationType, senderId],
  );

  return { messages, loading, error, sending, sendWarning, send };
}
