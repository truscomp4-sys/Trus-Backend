
import { Request, Response } from 'express';
import pool from '../config/db';

// Get all updates (public/admin)
export const getAllUpdates = async (req: Request, res: Response) => {
    try {
        const { include_hidden, startDate, endDate, page = 1, limit = 7, searchTerm, status } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        console.log('[LabourLaw] Filter params:', { status, searchTerm, startDate, endDate, page, limit });

        let query = 'SELECT * FROM labour_law_updates WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) FROM labour_law_updates WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        // Handle Status Filter (highest priority for visibility)
        if (status === 'active') {
            const condition = ` AND is_visible = true`;
            query += condition;
            countQuery += condition;
        } else if (status === 'inactive') {
            const condition = ` AND is_visible = false`;
            query += condition;
            countQuery += condition;
        } else if (status === 'all') {
            // Show all (both visible and hidden)
        } else {
            // Legacy behavior/Public view: only show visible if include_hidden isn't explicitly true
            if (include_hidden !== 'true') {
                const condition = ` AND is_visible = true`;
                query += condition;
                countQuery += condition;
            }
        }

        if (startDate) {
            const condition = ` AND release_date >= $${paramIndex++}`;
            query += condition;
            countQuery += condition;
            params.push(startDate);
        }

        if (endDate) {
            const condition = ` AND release_date <= $${paramIndex++}`;
            query += condition;
            countQuery += condition;
            params.push(endDate);
        }

        if (searchTerm) {
            const condition = ` AND title ILIKE $${paramIndex++}`;
            query += condition;
            countQuery += condition;
            params.push(`%${searchTerm}%`);
        }

        // Get total count
        const countResult = await pool.query(countQuery, params);
        const totalCount = parseInt(countResult.rows[0].count);

        // Add sorting and pagination
        query += ` ORDER BY release_date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        res.json({
            data: result.rows,
            pagination: {
                total: totalCount,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(totalCount / Number(limit))
            }
        });
    } catch (err) {
        console.error('Error fetching labour law updates:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get single update by ID
export const getUpdateById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM labour_law_updates WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Update not found' });
        }

        const update = result.rows[0];

        // Fetch documents from the new table
        const docsResult = await pool.query(
            'SELECT * FROM labour_law_documents WHERE update_id = $1 ORDER BY id ASC',
            [id]
        );

        if (docsResult.rows.length > 0) {
            update.documents = docsResult.rows;
        }

        res.json(update);
    } catch (err) {
        console.error('Error fetching labour law update:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Upsert (Create or Update)
export const upsertUpdate = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const {
            id,
            title,
            description,
            release_date,
            end_date,
            is_visible,
            speaker_name,
            speaker_role,
            speaker_org,
            speaker_image,
            webinar_link,
            documents,
            videos
        } = req.body;

        console.log('[LabourLaw] Upsert request:', { id, title, has_documents: !!documents, has_videos: !!videos, has_webinar: !!webinar_link });

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
        const safeWebinarLink = webinar_link ? webinar_link.trim() : null;

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
                    webinar_link = $10,
                    documents = $11,
                    videos = $12,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $13
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
                safeWebinarLink,
                JSON.stringify(safeDocuments),
                JSON.stringify(safeVideos),
                id
            ]);

            if (result.rows.length === 0) {
                console.error('[LabourLaw] Update failed - record not found:', id);
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Update not found' });
            }
        } else {
            // Insert
            console.log('[LabourLaw] Creating new record');
            const insertQuery = `
                INSERT INTO labour_law_updates(
                    title, description, release_date, end_date, is_visible,
                    speaker_name, speaker_role, speaker_org, speaker_image,
                    webinar_link, documents, videos
                ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
                safeWebinarLink,
                JSON.stringify(safeDocuments),
                JSON.stringify(safeVideos)
            ]);
        }

        const savedUpdateId = result.rows[0].id;

        // Sync documents with the new labour_law_documents table
        // 1. Delete existing documents for this update
        await client.query('DELETE FROM labour_law_documents WHERE update_id = $1', [savedUpdateId]);

        // 2. Insert new documents
        if (Array.isArray(safeDocuments) && safeDocuments.length > 0) {
            for (const doc of safeDocuments) {
                const insertDocQuery = `
                    INSERT INTO labour_law_documents (update_id, title, description, year, month, url)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `;
                await client.query(insertDocQuery, [
                    savedUpdateId,
                    doc.title || '',
                    doc.description || '',
                    doc.year || new Date(release_date).getFullYear(),
                    doc.month || new Date(release_date).toLocaleString('default', { month: 'long' }),
                    doc.url || ''
                ]);
            }
        }

        await client.query('COMMIT');
        console.log('[LabourLaw] Save successful:', savedUpdateId);
        res.json(result.rows[0]);
    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error('[LabourLaw] Error saving labour law update:', err);
        console.error('[LabourLaw] Error details:', err.message, err.stack);
        res.status(500).json({
            message: 'Internal server error',
            error: err.message
        });
    } finally {
        client.release();
    }
};

// Delete
export const deleteUpdate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM labour_law_updates WHERE id = $1', [id]);
        res.json({ message: 'Update deleted successfully' });
    } catch (err) {
        console.error('Error deleting labour law update:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
