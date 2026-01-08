import { Router } from 'express';
import { linktreeHandler } from './linktree.controller.js';

const linktreeRouter = Router();

linktreeRouter.post('/', linktreeHandler);

export { linktreeRouter };