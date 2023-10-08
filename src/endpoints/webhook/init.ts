import { Request, Response, Router } from 'express';
import { webhookEvent } from '../../services/payment';
const webhookRoute: Router = Router();

webhookRoute.post('/webhook', async (req: Request, res: Response) => {
  return await webhookEvent(req, res);
});

export default webhookRoute;