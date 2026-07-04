import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../config/db.js';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir))
    fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => { const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype); cb(null, ok); } });
const router = Router();
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: 'Invalid file' });
    const rec = await prisma.uploadedFile.create({ data: {
            filename: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            storageKey: req.file.filename,
            storage: 'local',
            isPrivate: true,
            uploadedBy: req.auth.userId
        } });
    res.json({ id: rec.id, url: `/uploads/${req.file.filename}` });
});
export default router;
