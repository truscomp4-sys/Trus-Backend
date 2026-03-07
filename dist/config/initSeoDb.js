"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./db"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const initSeoDb = async () => {
    try {
        console.log('Initializing SEO table...');
        // Create table
        await db_1.default.query(`
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
        `);
        // Create a unique index that treats NULLs as distinct for our UPSERT logic
        // We use COALESCE to treat NULL reference_id as an empty string for the unique constraint
        await db_1.default.query(`
            DROP INDEX IF EXISTS idx_seo_page_unique;
            CREATE UNIQUE INDEX idx_seo_page_unique ON seo_meta (page_type, COALESCE(page_reference_id, ''));
        `);
        console.log('SEO table initialized successfully.');
        process.exit(0);
    }
    catch (err) {
        console.error('Error initializing SEO database:', err);
        process.exit(1);
    }
};
initSeoDb();
