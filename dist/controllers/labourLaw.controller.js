"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUpdate = exports.upsertUpdate = exports.getUpdateById = exports.getAllUpdates = void 0;
const db_1 = __importDefault(require("../config/db"));
// Get all updates (public/admin)
const getAllUpdates = async (req, res) => {
    try {
        const { include_hidden, startDate, endDate } = req.query;
        let query = 'SELECT * FROM labour_law_updates WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        if (include_hidden !== 'true') {
            query += ` AND is_visible = true`;
        }
        if (startDate) {
            query += ` AND release_date >= $${paramIndex++}`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND release_date <= $${paramIndex++}`;
            params.push(endDate);
        }
        query += ' ORDER BY release_date DESC';
        const result = await db_1.default.query(query, params);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error fetching labour law updates:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllUpdates = getAllUpdates;
// Get single update by ID
const getUpdateById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db_1.default.query('SELECT * FROM labour_law_updates WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Update not found' });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error fetching labour law update:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUpdateById = getUpdateById;
// Upsert (Create or Update)
const upsertUpdate = async (req, res) => {
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        const { id, title, description, release_date, end_date, is_visible, speaker_name, speaker_role, speaker_org, speaker_image, documents, videos } = req.body;
        console.log('[LabourLaw] Upsert request:', { id, title, has_documents: !!documents, has_videos: !!videos });
        // Validate required fields
        if (!title || !release_date) {
            console.error('[LabourLaw] Missing required fields');
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Title and Release Date are required' });
        }
        // Sanitize and prepare data
        const safeDescription = description || '';
        const safeEndDate = end_date || null;
        const safeIsVisible = is_visible !== undefined ? is_visible : true;
        const safeSpeakerName = speaker_name || null;
        const safeSpeakerRole = speaker_role || null;
        const safeSpeakerOrg = speaker_org || null;
        const safeSpeakerImage = speaker_image || null;
        // Ensure documents and videos are arrays
        const safeDocuments = Array.isArray(documents) ? documents : [];
        const safeVideos = Array.isArray(videos) ? videos : [];
        let result;
        if (id && id !== 0) {
            // Update
            console.log('[LabourLaw] Updating existing record:', id);
            const updateQuery = `
                UPDATE labour_law_updates SET
                    title = $1,
                    description = $2,
                    release_date = $3,
                    end_date = $4,
                    is_visible = $5,
                    speaker_name = $6,
                    speaker_role = $7,
                    speaker_org = $8,
                    speaker_image = $9,
                    documents = $10,
                    videos = $11,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $12
                RETURNING *
            `;
            result = await client.query(updateQuery, [
                title,
                safeDescription,
                release_date,
                safeEndDate,
                safeIsVisible,
                safeSpeakerName,
                safeSpeakerRole,
                safeSpeakerOrg,
                safeSpeakerImage,
                JSON.stringify(safeDocuments),
                JSON.stringify(safeVideos),
                id
            ]);
            if (result.rows.length === 0) {
                console.error('[LabourLaw] Update failed - record not found:', id);
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Update not found' });
            }
        }
        else {
            // Insert
            console.log('[LabourLaw] Creating new record');
            const insertQuery = `
                INSERT INTO labour_law_updates (
                    title, description, release_date, end_date, is_visible,
                    speaker_name, speaker_role, speaker_org, speaker_image,
                    documents, videos
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;
            result = await client.query(insertQuery, [
                title,
                safeDescription,
                release_date,
                safeEndDate,
                safeIsVisible,
                safeSpeakerName,
                safeSpeakerRole,
                safeSpeakerOrg,
                safeSpeakerImage,
                JSON.stringify(safeDocuments),
                JSON.stringify(safeVideos)
            ]);
        }
        await client.query('COMMIT');
        console.log('[LabourLaw] Save successful:', result.rows[0].id);
        res.json(result.rows[0]);
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('[LabourLaw] Error saving labour law update:', err);
        console.error('[LabourLaw] Error details:', err.message, err.stack);
        res.status(500).json({
            message: 'Internal server error',
            error: err.message
        });
    }
    finally {
        client.release();
    }
};
exports.upsertUpdate = upsertUpdate;
// Delete
const deleteUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.query('DELETE FROM labour_law_updates WHERE id = $1', [id]);
        res.json({ message: 'Update deleted successfully' });
    }
    catch (err) {
        console.error('Error deleting labour law update:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteUpdate = deleteUpdate;
