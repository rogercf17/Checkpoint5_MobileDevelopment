import type { NextFunction, Request, Response } from 'express';
import { adminAuth } from '../services/firebaseAdmin';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Token ausente' });
    return;
  }
  try {
    res.locals.uid = (await adminAuth.verifyIdToken(token)).uid;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
