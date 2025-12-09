import { Router } from "express";
import {putLeadData} from "../controllers/Lead.controller";

const router = Router();

router.put('/:id/move', putLeadData);

export default router;