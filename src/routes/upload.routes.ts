import { Router } from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { verifyJWT, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Use memory storage to process file buffer
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow PDFs and standard images
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF documents and images are allowed'));
        }
    }
});

router.post('/', verifyJWT, isAdmin, upload.single('file'), async (req, res) => {
    console.log('[Upload] Request received');
    try {
        if (!req.file) {
            console.error('[Upload] No file provided');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log(`[Upload] Processing file: ${req.file.originalname} (${req.file.mimetype})`);

        // Convert buffer to base64 for Cloudinary upload
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        // Use 'raw' for PDFs to ensure they are treated as files (not images)
        // This is critical for correct download behavior and PDF storage
        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: "raw", // Forced to raw as per instructions
            folder: "truscomp_resources",
            public_id: req.file.originalname.split('.')[0] + '_' + Date.now(), // Unique ID
            use_filename: true
        });

        console.log('[Upload] Cloudinary success:', result.secure_url);

        res.json({
            url: result.secure_url,
            public_id: result.public_id
        });
    } catch (error: any) {
        console.error('[Upload] Error:', error);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

export default router;
