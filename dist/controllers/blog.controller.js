"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBlog = exports.upsertBlog = exports.getBlogById = exports.getAllBlogs = void 0;
const db_1 = __importDefault(require("../config/db"));
// PUBLIC & ADMIN: Get all blogs
const getAllBlogs = async (req, res) => {
    try {
        const { include_hidden } = req.query;
        let query = 'SELECT * FROM blogs';
        if (include_hidden !== 'true') {
            query += ' WHERE is_visible = true';
        }
        query += ' ORDER BY published_date DESC, created_at DESC';
        const result = await db_1.default.query(query);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error fetching blogs:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllBlogs = getAllBlogs;
// PUBLIC: Get blog by ID or slug
const getBlogById = async (req, res) => {
    const { id } = req.params;
    try {
        // Try ID first, then slug if ID is not a number
        let query = 'SELECT * FROM blogs WHERE id = $1';
        let params = [id];
        if (isNaN(Number(id))) {
            query = 'SELECT * FROM blogs WHERE slug = $1';
        }
        const result = await db_1.default.query(query, params);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error fetching blog:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getBlogById = getBlogById;
// Helper to generate a unique slug
const generateUniqueSlug = async (title, id) => {
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
        const result = await db_1.default.query(checkQuery, params);
        if (result.rowCount === 0) {
            exists = false;
        }
        else {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }
    }
    return uniqueSlug;
};
// ADMIN: Upsert blog
const upsertBlog = async (req, res) => {
    console.log('[BlogController] Upsert request received:', { body: req.body });
    let { id, title, slug, category, author, tags, published_date, date_text, read_time, short_description, long_description, final_thoughts, banner_image, attachments, is_visible } = req.body;
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
        const result = await db_1.default.query(query, params);
        console.log('[BlogController] Query successful, result:', result.rows[0]);
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('[BlogController] Error upserting blog:', err);
        if (err.code === '23505') { // Unique violation
            console.error('[BlogController] Unique constraint violation:', err.detail);
            return res.status(400).json({ message: 'A blog with this title or slug already exists' });
        }
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};
exports.upsertBlog = upsertBlog;
// ADMIN: Delete a blog
const deleteBlog = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.default.query('DELETE FROM blogs WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.json({ message: 'Blog deleted successfully' });
    }
    catch (err) {
        console.error('Error deleting blog:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteBlog = deleteBlog;
