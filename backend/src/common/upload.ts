import multer, { FileFilterCallback } from 'multer';
import { env } from '../config/env.js';
import fs from 'fs';
import path from 'path';
import { Request } from 'express';

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

type DestCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: DestCallback) => cb(null, uploadDir),
  filename: (_req: Request, file: Express.Multer.File, cb: FileNameCallback) => cb(null, `${Date.now()}-${file.originalname}`)
});

export const upload = multer({ storage });
