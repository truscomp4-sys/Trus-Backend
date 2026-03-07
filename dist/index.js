"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const seo_routes_1 = __importDefault(require("./routes/seo.routes"));
const enquiry_routes_1 = __importDefault(require("./routes/enquiry.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const service_routes_1 = __importDefault(require("./routes/service.routes"));
const resource_routes_1 = __importDefault(require("./routes/resource.routes"));
const compliance_routes_1 = __importDefault(require("./routes/compliance.routes"));
const blog_routes_1 = __importDefault(require("./routes/blog.routes"));
const testimonial_routes_1 = __importDefault(require("./routes/testimonial.routes"));
const holiday_routes_1 = __importDefault(require("./routes/holiday.routes"));
const labourLaw_routes_1 = __importDefault(require("./routes/labourLaw.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const path_1 = __importDefault(require("path"));
const initAdminDb_1 = __importDefault(require("./config/initAdminDb"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// Rate Limiting for Login
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 attempts
    message: { message: 'Too many login attempts, please try again after 15 minutes' }
});
// Middleware
const corsOptions = {
    origin: 'https://truscomp-frontend.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions)); // Handle preflight
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
// Minimal root route for Vercel deployment verification
app.get('/', (req, res) => {
    res.json({ message: 'Backend is running', status: 'ok' });
});
// Routes
app.use('/api/v1/auth', loginLimiter, auth_routes_1.default);
app.use('/api/v1/admin', admin_routes_1.default);
app.use('/api/v1/seo', seo_routes_1.default);
app.use('/api/v1/enquiries', enquiry_routes_1.default);
app.use('/api/v1/settings', settings_routes_1.default);
app.use('/api/v1/services', service_routes_1.default);
app.use('/api/v1/resources', resource_routes_1.default);
app.use('/api/v1/compliance', compliance_routes_1.default);
app.use('/api/v1/blogs', blog_routes_1.default);
app.use('/api/v1/testimonials', testimonial_routes_1.default);
app.use('/api/v1/holidays', holiday_routes_1.default);
app.use('/api/v1/labour-law-updates', labourLaw_routes_1.default);
app.use('/api/v1/upload', upload_routes_1.default);
// Static files
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../public/uploads')));
// Basic Health Check Route
app.get('/health', async (req, res) => {
    try {
        const result = await db_1.default.query('SELECT NOW()');
        res.json({
            status: 'ok',
            message: 'Server and Database are healthy',
            timestamp: result.rows[0].now
        });
    }
    catch (err) {
        console.error('Health check failed:', err);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed'
        });
    }
});
// Start Server
const startServer = async () => {
    // Initialize DB schema (add missing columns if needed)
    await (0, initAdminDb_1.default)();
    // Only listen if NOT in Vercel environment
    if (!process.env.VERCEL) {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }
};
startServer();
exports.default = app;
