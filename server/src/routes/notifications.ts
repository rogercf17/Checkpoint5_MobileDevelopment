import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { firestore } from '../services/firebaseAdmin';
import { resolveRecipients } from '../services/recipientResolver';
import { sendPush } from '../services/notificationSender';

const router = Router();

router.post('/messages', authenticate, async (req, res, next) => {
  try {
    const { conversationId, messageId } = (req.body ?? {}) as { conversationId?: string; messageId?: string };
    if (!conversationId || !messageId) {
      res.status(400).json({ error: 'Dados incompletos' });
      return;
    }
    const uid = res.locals.uid as string;
    const r = await resolveRecipients(uid, conversationId, messageId); // valida tudo antes do lock

    // Proteção contra duplicidade: create() falha com ALREADY_EXISTS (código 6) se já existir.
    const lock = firestore.collection('notificationDispatches').doc(`${conversationId}_${messageId}`);
    try {
      await lock.create({ senderId: uid, createdAt: Date.now() });
    } catch (e) {
      if ((e as { code?: number }).code === 6) {
        res.json({ sent: 0, duplicate: true });
        return;
      }
      throw e;
    }

    try {
      const sent = await sendPush(r.recipients, r.title, {
        conversationId,
        conversationType: conversationId.startsWith('direct_') ? 'direct' : 'group',
      });
      res.json({ sent, duplicate: false });
    } catch (e) {
      await lock.delete().catch(() => undefined); // permite nova tentativa se o envio falhou
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

export default router;
