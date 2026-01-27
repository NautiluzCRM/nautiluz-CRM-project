
import { Router } from 'express';
import { getPipelineData } from '../controllers/Pipeline.controller.js';

const router = Router();

router.get('/', getPipelineData);


export default router;