import express from 'express';
import cors from 'cors';
import notificationsRouter from './routes/notifications';
import groupsRouter from './routes/groups';
import usersRouter from './routes/users';
import { errorHandler } from './middleware/errorHandler';

const app = express();
app.use(express.json());
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/notifications', notificationsRouter);
app.use('/groups', groupsRouter);
app.use('/users', usersRouter);

app.use(errorHandler);

app.listen(Number(process.env.PORT ?? 3000), () => {
  console.log('API no ar');
});
