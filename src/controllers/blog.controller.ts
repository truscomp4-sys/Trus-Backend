import { Request, Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// PUBLIC & ADMIN: Get all blogs
export const getAllBlogs = async (req: Request, res: Response) => {
    try {
        const { include_hidden, page = 1, limit = 7, searchTerm, status } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = 'SELECT * FROM blogs WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) FROM blogs WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        // Handle Status Filter
        const statusValue = typeof status === 'string' ? status.trim().toLowerCase() : null;
        if (statusValue === 'active') {
            const condition = ' AND is_visible = true';
            query += condition;
            countQuery += condition;
        } else if (statusValue === 'inactive') {
            const condition = ' AND is_visible = false';
            query += condition;
            countQuery += condition;
        } else if (statusValue === 'all') {
            // Show all
        } else {
            // Default visibility
            if (include_hidden !== 'true') {
                const condition = ' AND is_visible = true';
                query += condition;
                countQuery += condition;
            }
        }

        if (searchTerm) {
            const condition = ` AND (title ILIKE $${paramIndex} OR author ILIKE $${paramIndex})`;
            query += condition;
            countQuery += condition;
            params.push(`%${searchTerm}%`);
            paramIndex++;
        }

        // Get total count
        const countResult = await pool.query(countQuery, params);
        const totalCount = parseInt(countResult.rows[0].count);

        // Add sorting and pagination
        query += ` ORDER BY published_date DESC, created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
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
        console.error('Error fetching blogs:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// PUBLIC: Get blog by ID or slug
export const getBlogById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        // Try ID first, then slug if ID is not a number
        let query = 'SELECT * FROM blogs WHERE id = $1';
        let params = [id];

        if (isNaN(Number(id))) {
            query = 'SELECT * FROM blogs WHERE slug = $1';
        }

        const result = await pool.query(query, params);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching blog:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Helper to generate a unique slug
const generateUniqueSlug = async (title: string, id: number | null): Promise<string> => {
    let slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');

    // Check if slug already exists
    let uniqueSlug = slug;
    let counter = 1;
    let exists = true;

    while (exists) {
        const checkQuery = id
            ? 'SELECT id FROM blogs WHERE slug = $1 AND id != $2'
            : 'SELECT id FROM blogs WHERE slug = $1';
        const params = id ? [uniqueSlug, id] : [uniqueSlug];

        const result = await pool.query(checkQuery, params);
        if (result.rowCount === 0) {
            exists = false;
        } else {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }
    }
    return uniqueSlug;
};

// ADMIN: Upsert blog
export const upsertBlog = async (req: AuthRequest, res: Response) => {
    console.log('[BlogController] Upsert request received:', { body: req.body });
    let {
        id, title, slug, category, author, tags,
        published_date, date_text, read_time,
        short_description, long_description, final_thoughts,
        banner_image, attachments, is_visible
    } = req.body;

    if (!title) {
        console.error('[BlogController] Title missing');
        return res.status(400).json({ message: 'Title is required' });
    }

    try {
        // Auto-generate slug if not provided or if it's a new blog
        // This ensures the URL is always clean and unique
        if (!slug || id === 0) {
            console.log('[BlogController] Generating unique slug for:', title);
            slug = await generateUniqueSlug(title, id || null);
            console.log('[BlogController] Generated slug:', slug);
        }

        const query = `
            INSERT INTO blogs (
                id, title, slug, category, author, tags, 
                published_date, date_text, read_time,
                short_description, long_description, final_thoughts,
                banner_image, attachments, is_visible
            )
            VALUES (
                COALESCE($1, nextval('blogs_id_seq')), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
            )
            ON CONFLICT (id) 
            DO UPDATE SET 
                title = EXCLUDED.title,
                slug = EXCLUDED.slug,
                category = EXCLUDED.category,
                author = EXCLUDED.author,
                tags = EXCLUDED.tags,
                published_date = EXCLUDED.published_date,
                date_text = EXCLUDED.date_text,
                read_time = EXCLUDED.read_time,
                short_description = EXCLUDED.short_description,
                long_description = EXCLUDED.long_description,
                final_thoughts = EXCLUDED.final_thoughts,
                banner_image = EXCLUDED.banner_image,
                attachments = EXCLUDED.attachments,
                is_visible = EXCLUDED.is_visible
            RETURNING *
        `;

        const params = [
            id || null, title, slug, category, author, JSON.stringify(tags || []),
            published_date, date_text, read_time,
            short_description, long_description, final_thoughts,
            banner_image, JSON.stringify(attachments || []), is_visible ?? true
        ];

        console.log('[BlogController] Executing query with params:', params);

        const result = await pool.query(query, params);

        console.log('[BlogController] Query successful, result:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (err: any) {
        console.error('[BlogController] Error upserting blog:', err);
        if (err.code === '23505') { // Unique violation
            console.error('[BlogController] Unique constraint violation:', err.detail);
            return res.status(400).json({ message: 'A blog with this title or slug already exists' });
        }
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

// ADMIN: Delete a blog
export const deleteBlog = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM blogs WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.json({ message: 'Blog deleted successfully' });
    } catch (err) {
        console.error('Error deleting blog:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
