import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../services/firebaseAdmin';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err); // detalhes só no log do servidor
  res.status(500).json({ error: 'Erro interno do servidor' });
}
