import { Request, Response } from 'express';
import pool from '../config/db';
import cloudinary from '../config/cloudinary';

// PUBLIC & ADMIN: Get all resources with filtering and pagination
export const getResources = async (req: Request, res: Response) => {
    try {
        const { category, state, include_hidden, startDate, endDate, searchTerm, page = 1, limit = 7, status } = req.query;
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 7;
        const offset = (pageNum - 1) * limitNum;

        const isHolidays = category === 'Holidays List';
        const params: any[] = [];

        let baseCondition = "WHERE category != 'Labour Law Updates'";

        // Handle Status Filter
        const statusValue = typeof status === 'string' ? status.trim().toLowerCase() : null;
        if (statusValue === 'active') {
            baseCondition += ' AND is_visible = TRUE';
        } else if (statusValue === 'inactive') {
            baseCondition += ' AND is_visible = FALSE';
        } else if (statusValue === 'all') {
            // No visibility condition
        } else {
            // Default visibility
            if (include_hidden !== 'true') {
                baseCondition += ' AND is_visible = TRUE';
            }
        }

        if (category) {
            params.push(category);
            baseCondition += ` AND category = $${params.length}`;
        }

        if (state && state !== 'All States' && state !== 'Central') {
            params.push(state);
            baseCondition += ` AND state = $${params.length}`;
        } else if (state === 'Central') {
            params.push('Central');
            baseCondition += ` AND state = $${params.length}`;
        }

        if (startDate) {
            params.push(startDate);
            baseCondition += ` AND release_date >= $${params.length}`;
        }

        if (endDate) {
            params.push(endDate);
            baseCondition += ` AND release_date <= $${params.length}`;
        }

        if (searchTerm) {
            params.push(`%${searchTerm}%`);
            baseCondition += ` AND title ILIKE $${params.length}`;
        }

        let query: string;
        let countQuery: string;

        if (isHolidays) {
            // Grouped Holidays Query - robustly handle string dates and grouping
            query = `
                SELECT 
                    state, 
                    COALESCE(EXTRACT(YEAR FROM (CASE WHEN effective_date ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN effective_date::DATE ELSE NULL END))::integer, 0) as holiday_year,
                    COUNT(*)::integer as holiday_count,
                    BOOL_OR(is_visible) as is_visible,
                    JSON_AGG(r.* ORDER BY effective_date ASC) as items
                FROM resources r
                ${baseCondition}
                GROUP BY state, holiday_year
                ORDER BY holiday_year DESC, state ASC
            `;
            countQuery = `
                SELECT COUNT(*) FROM (
                    SELECT 1 FROM resources r
                    ${baseCondition}
                    GROUP BY state, COALESCE(EXTRACT(YEAR FROM (CASE WHEN effective_date ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN effective_date::DATE ELSE NULL END))::integer, 0)
                ) as grouped_count
            `;
        } else {
            // Standard Flat Query
            query = `SELECT * FROM resources ${baseCondition} ORDER BY release_date DESC, created_at DESC`;
            countQuery = `SELECT COUNT(*) FROM resources ${baseCondition}`;
        }

        // Get total count
        const totalResult = await pool.query(countQuery, params);
        const total = parseInt(totalResult.rows[0].count);

        // Add pagination
        params.push(limitNum);
        query += ` LIMIT $${params.length}`;
        params.push(offset);
        query += ` OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        res.json({
            resources: result.rows,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        console.error('Error fetching resources:', err);
        res.status(500).json({ message: 'Internal server error', error: err instanceof Error ? err.message : String(err) });
    }
};

export const upsertResource = async (req: Request, res: Response) => {
    try {
        const { id, title, category, description, download_url, release_date, effective_date, state, is_visible, public_id } = req.body;

        // Sanitize inputs
        const safe_public_id = public_id || null;
        const safe_id = (id && id !== 0 && id !== "0") ? id : null;

        // Ensure dates are not empty strings
        const safe_release_date = release_date || null;
        const safe_effective_date = effective_date || null;

        // Placeholder for legacy fields if they exist in DB
        const speaker_name = null;
        const speaker_role = null;
        const speaker_org = null;
        const speaker_image = null;

        let result;

        if (safe_id) {
            // --- UPDATE OPERATION ---

            // If updating and new file uploaded (public_id changed), delete old file
            if (safe_public_id) {
                try {
                    const oldResource = await pool.query('SELECT public_id FROM resources WHERE id = $1', [safe_id]);
                    if (oldResource.rows.length > 0 && oldResource.rows[0].public_id && oldResource.rows[0].public_id !== safe_public_id) {
                        await cloudinary.uploader.destroy(oldResource.rows[0].public_id);
                    }
                } catch (e) {
                    console.error("Error deleting old Cloudinary asset", e);
                }
            }

            const updateQuery = `
                UPDATE resources 
                SET title = $1, description = $2, release_date = $3, effective_date = $4,
    state = $5, category = $6, download_url = $7, is_visible = $8, public_id = $9
                WHERE id = $10
RETURNING *
    `;

            const updateValues = [
                title, description, safe_release_date, safe_effective_date,
                state, category, download_url || "", is_visible ?? true, safe_public_id,
                safe_id
            ];

            result = await pool.query(updateQuery, updateValues);

        } else {
            // --- INSERT OPERATION ---
            // Rely on DB 'SERIAL' or 'sequence' for ID generation automatically

            const insertQuery = `
                INSERT INTO resources(
        title, description, release_date, effective_date, state,
        category, download_url, speaker_name, speaker_role,
        speaker_org, speaker_image, is_visible, public_id
    )
VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
RETURNING *
    `;

            const insertValues = [
                title, description, safe_release_date, safe_effective_date,
                state, category, download_url || "", speaker_name, speaker_role,
                speaker_org, speaker_image, is_visible ?? true, safe_public_id
            ];

            result = await pool.query(insertQuery, insertValues);
        }

        res.json(result.rows[0]);

    } catch (err: any) {
        console.error('Upsert resource error FULL OBJECT:', JSON.stringify(err, null, 2));
        res.status(500).json({ message: 'Error saving resource', error: err.message });
    }
};

export const deleteResource = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Get public_id to delete from Cloudinary
        const resource = await pool.query('SELECT public_id FROM resources WHERE id = $1', [id]);

        if (resource.rows.length > 0 && resource.rows[0].public_id) {
            await cloudinary.uploader.destroy(resource.rows[0].public_id);
        }

        await pool.query('DELETE FROM resources WHERE id = $1', [id]);
        res.json({ message: 'Resource deleted' });
    } catch (err) {
        console.error('Delete resource error:', err);
        res.status(500).json({ message: 'Error deleting resource' });
    }
};
