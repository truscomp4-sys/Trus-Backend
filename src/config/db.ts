import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Neon and other hosted PG instances
    },
    max: 10,
    idleTimeoutMillis: 30000,  // close idle connections after 30s (before Neon drops them)
    connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
    console.log('Connected to Neon PostgreSQL');
});

pool.on('error', (err) => {
    // Neon serverless drops idle connections — log and continue, do not crash
    console.warn('Idle client error (Neon auto-suspend), ignoring:', err.message);
});

export default pool;
