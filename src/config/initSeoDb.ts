import pool from './db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const initSeoDb = async () => {
    try {
        console.log('Initializing SEO table...');

        // Create table
        await pool.query(`
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
        await pool.query(`
            DROP INDEX IF EXISTS idx_seo_page_unique;
            CREATE UNIQUE INDEX idx_seo_page_unique ON seo_meta (page_type, COALESCE(page_reference_id, ''));
        `);

        console.log('SEO table initialized successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error initializing SEO database:', err);
        process.exit(1);
    }
};

initSeoDb();
