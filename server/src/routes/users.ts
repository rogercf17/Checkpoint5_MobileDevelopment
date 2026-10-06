import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getProfile } from '../services/profileService';

const router = Router();

router.get('/:uid/profile', authenticate, async (req, res, next) => {
  try {
    res.json(await getProfile(res.locals.uid as string, String(req.params.uid)));
  } catch (e) {
    next(e);
  }
});

export default router;
