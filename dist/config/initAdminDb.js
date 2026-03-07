"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./db"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const initAdminDb = async () => {
    try {
        console.log('Initializing Admin Database Tables...');
        // 0. Admins Management
        console.log(' - Checking Admins table...');
        await db_1.default.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'admin',
                status VARCHAR(20) DEFAULT 'active',
                last_login TIMESTAMP,
                reset_password_token VARCHAR(255),
                reset_password_expires BIGINT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        // Seed initial admin if none exists
        const adminCheck = await db_1.default.query('SELECT COUNT(*) FROM admins');
        if (parseInt(adminCheck.rows[0].count) === 0) {
            console.log(' - Seeding initial admin (admin@truscomp.com)...');
            // Password is 'admin123'
            await db_1.default.query(`
                INSERT INTO admins (name, email, password_hash, role)
                VALUES ('System Administrator', 'admin@truscomp.com', '$2b$10$L7Wd8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z', 'admin')
            `);
        }
        // 1. Services Management
        console.log(' - Checking Services tables...');
        await db_1.default.query(`
            CREATE TABLE IF NOT EXISTS services (
                id SERIAL PRIMARY KEY,
                slug VARCHAR(100) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                category_id VARCHAR(50) NOT NULL,
                short_overview TEXT,
                long_overview TEXT,
                doodle_type VARCHAR(50),
                state VARCHAR(100),
                is_visible BOOLEAN DEFAULT TRUE,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Safe schema updates for services
            ALTER TABLE services ADD COLUMN IF NOT EXISTS short_overview TEXT;
            ALTER TABLE services ADD COLUMN IF NOT EXISTS long_overview TEXT;
            ALTER TABLE services ADD COLUMN IF NOT EXISTS state VARCHAR(100);
            ALTER TABLE services ADD COLUMN IF NOT EXISTS category_id VARCHAR(50);
            
            CREATE TABLE IF NOT EXISTS service_problems (
                id SERIAL PRIMARY KEY,
                service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
                problem_text TEXT NOT NULL,
                sort_order INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS service_features (
                id SERIAL PRIMARY KEY,
                service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                hint TEXT,
                sort_order INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS service_benefits (
                id SERIAL PRIMARY KEY,
                service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
                keyword VARCHAR(100) NOT NULL,
                text TEXT NOT NULL,
                sort_order INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS service_why_truscomp (
                id SERIAL PRIMARY KEY,
                service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
                point_text TEXT NOT NULL,
                sort_order INTEGER DEFAULT 0
            );

            ALTER TABLE services ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
            ALTER TABLE services ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
        `);
        // 2. Resources & Compliance
        console.log(' - Checking Resources & Compliance tables...');
        await db_1.default.query(`
            CREATE TABLE IF NOT EXISTS resources (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                release_date VARCHAR(50),
                effective_date VARCHAR(50),
                state VARCHAR(100),
                category VARCHAR(100) NOT NULL,
                download_url TEXT,
                speaker_name VARCHAR(255),
                speaker_role VARCHAR(255),
                speaker_org VARCHAR(255),
                speaker_image TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS compliance_updates (
                id SERIAL PRIMARY KEY,
                slug VARCHAR(255) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                summary TEXT,
                category VARCHAR(50),
                date_text VARCHAR(50),
                impact VARCHAR(50),
                action_required VARCHAR(50),
                overview_content TEXT,
                what_changed_content TEXT,
                who_it_impacts_content TEXT,
                what_you_should_do_content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS holidays (
                id SERIAL PRIMARY KEY,
                state_code VARCHAR(10) NOT NULL,
                holiday_date DATE NOT NULL,
                day_name VARCHAR(20),
                holiday_name VARCHAR(255) NOT NULL,
                holiday_type VARCHAR(50) DEFAULT 'Gazetted'
            );

            ALTER TABLE resources ADD COLUMN IF NOT EXISTS public_id VARCHAR(255);
            ALTER TABLE resources ADD COLUMN IF NOT EXISTS speaker_name VARCHAR(255);
            ALTER TABLE resources ADD COLUMN IF NOT EXISTS speaker_role VARCHAR(255);
            ALTER TABLE resources ADD COLUMN IF NOT EXISTS speaker_org VARCHAR(255);
            ALTER TABLE resources ADD COLUMN IF NOT EXISTS speaker_image TEXT;
            ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
        `);
        // 3. Blogs & Testimonials
        console.log(' - Checking Blogs & Testimonials tables...');
        await db_1.default.query(`
            CREATE TABLE IF NOT EXISTS blogs (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                category VARCHAR(100),
                author VARCHAR(255),
                tags JSONB,
                published_date DATE,
                date_text VARCHAR(50),
                read_time VARCHAR(20),
                short_description TEXT,
                long_description TEXT,
                final_thoughts TEXT,
                banner_image TEXT,
                attachments JSONB,
                is_visible BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            ALTER TABLE blogs ADD COLUMN IF NOT EXISTS author VARCHAR(255);
            ALTER TABLE blogs ADD COLUMN IF NOT EXISTS tags JSONB;
            ALTER TABLE blogs ADD COLUMN IF NOT EXISTS published_date DATE;
            ALTER TABLE blogs ADD COLUMN IF NOT EXISTS date_text VARCHAR(50);
            ALTER TABLE blogs ADD COLUMN IF NOT EXISTS read_time VARCHAR(20);
            ALTER TABLE blogs ADD COLUMN IF NOT EXISTS short_description TEXT;
            ALTER TABLE blogs ADD COLUMN IF NOT EXISTS long_description TEXT;
            ALTER TABLE blogs ADD COLUMN IF NOT EXISTS final_thoughts TEXT;
            ALTER TABLE blogs ADD COLUMN IF NOT EXISTS banner_image TEXT;
            ALTER TABLE blogs ADD COLUMN IF NOT EXISTS attachments JSONB;
            ALTER TABLE blogs ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;

            CREATE TABLE IF NOT EXISTS testimonials (
                id SERIAL PRIMARY KEY,
                quote TEXT NOT NULL,
                client_name VARCHAR(255) NOT NULL,
                designation VARCHAR(255),
                company VARCHAR(255),
                engagement_type VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS why_choose_us (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                icon_name VARCHAR(50)
            );

            ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5;
            ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS image_url TEXT;
            ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
        `);
        // 4. Leads & Settings
        console.log(' - Checking Enquiries & Settings tables...');
        await db_1.default.query(`
            CREATE TABLE IF NOT EXISTS enquiries (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                company VARCHAR(255),
                phone VARCHAR(20),
                industry VARCHAR(100),
                employees VARCHAR(50),
                service_interest VARCHAR(100),
                message TEXT,
                status VARCHAR(20) DEFAULT 'new',
                notes TEXT,
                confirmed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS settings (
                key VARCHAR(100) PRIMARY KEY,
                value JSONB NOT NULL
            );

            -- 5. SEO Metadata
            CREATE TABLE IF NOT EXISTS seo_meta (
                id SERIAL PRIMARY KEY,
                page_type VARCHAR(50) NOT NULL,
                page_reference_id VARCHAR(100),
                meta_title VARCHAR(255),
                meta_description TEXT,
                meta_keywords TEXT,
                canonical_url TEXT,
                og_title VARCHAR(255),
                og_description TEXT,
                og_image TEXT,
                twitter_title VARCHAR(255),
                twitter_description TEXT,
                robots VARCHAR(100) DEFAULT 'index, follow',
                schema_type VARCHAR(100) DEFAULT 'Organization',
                status VARCHAR(20) DEFAULT 'published',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            DROP INDEX IF EXISTS idx_seo_page_unique;
            CREATE UNIQUE INDEX idx_seo_page_unique ON seo_meta (page_type, COALESCE(page_reference_id, ''));

            -- 6. Labour Law Updates
            CREATE TABLE IF NOT EXISTS labour_law_updates (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                release_date DATE NOT NULL,
                end_date DATE,
                is_visible BOOLEAN DEFAULT TRUE,
                speaker_name VARCHAR(255),
                speaker_role VARCHAR(255),
                speaker_org VARCHAR(255),
                speaker_image TEXT,
                documents JSONB,
                videos JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Seed default categories for services if not exists
            INSERT INTO settings (key, value)
            VALUES ('service_categories', '["Labor law Compliance", "Audit & Verification", "Licensing & Registration", "Industrial Relations", "Payroll & Remittances"]')
            ON CONFLICT (key) DO NOTHING;
        `);
        console.log('All Admin Database tables initialized successfully.');
    }
    catch (err) {
        console.error('CRITICAL: Error initializing Admin Database:', err.message);
        console.error('Error Details:', err);
    }
};
// function exported for use in index.ts
exports.default = initAdminDb;
