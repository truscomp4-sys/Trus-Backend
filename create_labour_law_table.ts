
import pool from './src/config/db';

const createTableQuery = `
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
        speaker_image VARCHAR(255),
        documents JSONB DEFAULT '[]',
        videos JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
`;

const run = async () => {
    try {
        await pool.query(createTableQuery);
        console.log("Table 'labour_law_updates' created successfully.");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        await pool.end();
    }
};

run();
