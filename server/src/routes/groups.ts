import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  addMember,
  createGroup,
  removeMember,
  updateGroup,
  type CreateGroupInput,
  type UpdateGroupInput,
} from '../services/groupService';
import { HttpError } from '../services/firebaseAdmin';

const router = Router();
router.use(authenticate);

router.post('/', async (req, res, next) => {
  try {
    const out = await createGroup(res.locals.uid as string, (req.body ?? {}) as CreateGroupInput);
    res.status(201).json(out);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    await updateGroup(String(req.params.id), res.locals.uid as string, (req.body ?? {}) as UpdateGroupInput);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/members', async (req, res, next) => {
  try {
    const { userId } = (req.body ?? {}) as { userId?: unknown };
    if (typeof userId !== 'string' || !userId) throw new HttpError(400, 'Informe o userId');
    const memberIds = await addMember(String(req.params.id), res.locals.uid as string, userId);
    res.status(201).json({ memberIds });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/members/:uid', async (req, res, next) => {
  try {
    const memberIds = await removeMember(String(req.params.id), res.locals.uid as string, String(req.params.uid));
    res.json({ memberIds });
  } catch (e) {
    next(e);
  }
});

export default router;
