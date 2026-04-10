import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import pool from './config/db';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import seoRoutes from './routes/seo.routes';

import enquiryRoutes from './routes/enquiry.routes';
import settingsRoutes from './routes/settings.routes';
import serviceRoutes from './routes/service.routes';
import resourceRoutes from './routes/resource.routes';
import complianceRoutes from './routes/compliance.routes';
import blogRoutes from './routes/blog.routes';
import testimonialRoutes from './routes/testimonial.routes';
import holidayRoutes from './routes/holiday.routes';
import labourLawRoutes from './routes/labourLaw.routes';
import uploadRoutes from './routes/upload.routes';
import path from 'path';
import initAdminDb from './config/initAdminDb';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Rate Limiting for Login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 attempts
    message: { message: 'Too many login attempts, please try again after 15 minutes' }
});

// Middleware
const allowedOrigins = [
    'https://truscomp-frontend.vercel.app',
    'https://truscomp.com',
    'https://www.truscomp.com',
    'http://localhost:8080',
    'http://localhost:3000',
    process.env.CLIENT_URL
].filter(Boolean) as string[];

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (e.g. curl, mobile apps)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked for origin: ${origin}`);
            // Don't throw a hard error to avoid disrupting the request flow
            callback(null, false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight
app.use(cookieParser());
app.use(express.json());

// Minimal root route for Vercel deployment verification
app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Backend is running', status: 'ok' });
});

// Routes
app.use('/api/v1/auth', loginLimiter, authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/seo', seoRoutes);
app.use('/api/v1/enquiries', enquiryRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/v1/compliance', complianceRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/testimonials', testimonialRoutes);
app.use('/api/v1/holidays', holidayRoutes);
app.use('/api/v1/labour-law-updates', labourLawRoutes);
app.use('/api/v1/upload', uploadRoutes);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Basic Health Check Route
app.get('/health', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            status: 'ok',
            message: 'Server and Database are healthy',
            timestamp: result.rows[0].now
        });
    } catch (err) {
        console.error('Health check failed:', err);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed'
        });
    }
});

// Start Server
const startServer = async () => {
    // Start listening immediately so Hostinger/Passenger sees the app as ready
    const server = app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        
        // Initialize DB schema in the background after starting
        initAdminDb().catch(err => {
            console.error('Background DB initialization failed:', err);
        });
    });

    // Handle process signals for graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            console.log('HTTP server closed');
            pool.end().then(() => console.log('DB pool closed'));
        });
    });
};

startServer();

export default app;
