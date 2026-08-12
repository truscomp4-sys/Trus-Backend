import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import http from 'http';
import https from 'https';
import cloudinary from '../config/cloudinary';
import { verifyJWT, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Use memory storage to process file buffer
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip',
            'application/x-zip-compressed',
            'text/plain',
            'text/csv'
        ];

        const ext = path.extname(file.originalname).toLowerCase();
        const allowedExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.txt', '.csv', '.png', '.jpg', '.jpeg', '.webp'];

        if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/') || allowedExts.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only document files (PDF, DOCX, DOC, XLSX, ZIP, CSV) and images are allowed'));
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

        // Preserve original extension so Cloudinary raw delivery headers and browser downloads retain .pdf, .docx, etc.
        const ext = path.extname(req.file.originalname) || '';
        const rawBaseName = path.basename(req.file.originalname, ext);
        const sanitizedBaseName = rawBaseName.replace(/[^a-zA-Z0-9_\-]/g, '_');
        const publicId = `${sanitizedBaseName}_${Date.now()}${ext}`;

        const isImage = req.file.mimetype.startsWith('image/');
        const resourceType = isImage ? 'image' : 'raw';

        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: resourceType,
            folder: "truscomp_resources",
            public_id: publicId,
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

router.get('/download', async (req, res) => {
    try {
        const fileUrl = req.query.url as string;
        let customFilename = req.query.filename as string;

        if (!fileUrl || fileUrl === 'undefined' || fileUrl === 'null' || !fileUrl.trim()) {
            return res.status(400).json({ message: 'Valid URL query parameter is required' });
        }

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(fileUrl);
        } catch {
            return res.status(400).json({ message: 'Invalid URL format' });
        }

        if (!parsedUrl.hostname.endsWith('cloudinary.com') && !parsedUrl.hostname.endsWith('res.cloudinary.com')) {
            return res.status(403).json({ message: 'Forbidden domain' });
        }

        if (!customFilename) {
            customFilename = path.basename(parsedUrl.pathname);
        }

        let ext = path.extname(customFilename).toLowerCase();
        if (!ext) {
            if (fileUrl.toLowerCase().includes('pdf') || customFilename.toLowerCase().includes('pdf') || customFilename.toLowerCase().includes('pan')) {
                ext = '.pdf';
            } else if (fileUrl.toLowerCase().includes('doc')) {
                ext = '.docx';
            } else {
                ext = '.pdf';
            }
            customFilename += ext;
        }

        const mimeTypes: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xls': 'application/vnd.ms-excel',
            '.zip': 'application/zip',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.csv': 'text/csv'
        };

        // Parse Cloudinary URL into publicId and resourceType to generate an authenticated download URL
        let downloadUrl = fileUrl;
        const urlParts = parsedUrl.pathname.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex !== -1 && uploadIndex > 0) {
            const resourceType = urlParts[uploadIndex - 1]; // 'raw', 'image', 'video'
            let publicIdParts = urlParts.slice(uploadIndex + 1);
            // Remove version prefix if present (e.g. v1786534681)
            if (publicIdParts[0] && /^v\d+$/.test(publicIdParts[0])) {
                publicIdParts = publicIdParts.slice(1);
            }
            const publicId = decodeURIComponent(publicIdParts.join('/'));
            try {
                downloadUrl = cloudinary.utils.private_download_url(publicId, '', {
                    resource_type: resourceType,
                    type: 'upload'
                });
            } catch (err: any) {
                console.error('[Download Proxy] Failed to generate private download URL:', err.message);
            }
        }

        const contentType = mimeTypes[ext] || 'application/octet-stream';
        const parsedDownloadUrl = new URL(downloadUrl);
        const client = parsedDownloadUrl.protocol === 'https:' ? https : http;

        client.get(downloadUrl, (remoteRes) => {
            if (remoteRes.statusCode && remoteRes.statusCode >= 400) {
                console.error('[Download Proxy] Remote request failed with status:', remoteRes.statusCode);
                return res.status(remoteRes.statusCode).json({ message: 'Failed to retrieve file from storage' });
            }

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(customFilename)}"`);

            if (remoteRes.headers['content-length']) {
                res.setHeader('Content-Length', remoteRes.headers['content-length']);
            }

            remoteRes.pipe(res);
        }).on('error', (err) => {
            console.error('[Download Proxy] Request error:', err);
            res.status(500).json({ message: 'Failed to download file', error: err.message });
        });

    } catch (err: any) {
        console.error('[Download Proxy] Error:', err);
        res.status(500).json({ message: 'Download error', error: err.message });
    }
});

export default router;
