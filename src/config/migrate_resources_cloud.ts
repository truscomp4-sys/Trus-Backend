import pool from './db';

const migrate = async () => {
    try {
        console.log('Running migration: Add public_id to resources');
        await pool.query('ALTER TABLE resources ADD COLUMN IF NOT EXISTS public_id VARCHAR(255);');
        console.log('Migration successful');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
