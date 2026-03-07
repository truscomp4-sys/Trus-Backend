"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSEODiscovery = exports.deleteSEO = exports.getSEOPublic = exports.upsertSEO = exports.getSEOAdmin = void 0;
const db_1 = __importDefault(require("../config/db"));
// ADMIN: Get SEO by page type and reference
const getSEOAdmin = async (req, res) => {
    const { page_type, page_reference_id } = req.query;
    try {
        const query = page_reference_id
            ? 'SELECT * FROM seo_meta WHERE page_type = $1 AND page_reference_id = $2'
            : 'SELECT * FROM seo_meta WHERE page_type = $1 AND page_reference_id IS NULL';
        const params = page_reference_id ? [page_type, page_reference_id] : [page_type];
        const result = await db_1.default.query(query, params);
        res.json(result.rows[0] || null);
    }
    catch (err) {
        console.error('SEO ADMIN FETCH ERROR:', err.message);
        console.error('Params:', { page_type, page_reference_id });
        res.status(500).json({
            message: 'Internal server error fetching SEO',
            error: err.message
        });
    }
};
exports.getSEOAdmin = getSEOAdmin;
// ADMIN: Create or Update SEO
const upsertSEO = async (req, res) => {
    const { page_type, page_reference_id, meta_title, meta_description, meta_keywords, canonical_url, og_title, og_description, og_image, twitter_title, twitter_description, robots, schema_type, status } = req.body;
    try {
        const result = await db_1.default.query(`
            INSERT INTO seo_meta (
                page_type, page_reference_id, meta_title, meta_description, meta_keywords, 
                canonical_url, og_title, og_description, og_image, twitter_title, 
                twitter_description, robots, schema_type, status, updated_at
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
            ON CONFLICT (page_type, (COALESCE(page_reference_id, ''))) 
            DO UPDATE SET 
                meta_title = EXCLUDED.meta_title,
                meta_description = EXCLUDED.meta_description,
                meta_keywords = EXCLUDED.meta_keywords,
                canonical_url = EXCLUDED.canonical_url,
                og_title = EXCLUDED.og_title,
                og_description = EXCLUDED.og_description,
                og_image = EXCLUDED.og_image,
                twitter_title = EXCLUDED.twitter_title,
                twitter_description = EXCLUDED.twitter_description,
                robots = EXCLUDED.robots,
                schema_type = EXCLUDED.schema_type,
                status = EXCLUDED.status,
                updated_at = NOW()
            RETURNING *
        `, [
            page_type, page_reference_id || null, meta_title, meta_description, meta_keywords,
            canonical_url, og_title, og_description, og_image, twitter_title,
            twitter_description, robots, schema_type, status
        ]);
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error upserting SEO:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};
exports.upsertSEO = upsertSEO;
// Helper to generate slug for matching
const slugify = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
};
// PUBLIC: Get SEO for frontend
const getSEOPublic = async (req, res) => {
    let { page_type, page_reference_id } = req.query;
    try {
        // Prepare page_reference_id string
        let refIdStr = page_reference_id;
        // If it's a blog and reference is slug, resolve using DB slug column
        if (page_type === 'blog' && refIdStr && isNaN(Number(refIdStr))) {
            const blogRes = await db_1.default.query('SELECT id FROM blogs WHERE slug = $1', [refIdStr]);
            if (blogRes.rows.length > 0) {
                refIdStr = blogRes.rows[0].id.toString();
            }
        }
        // If it's a labour law update and reference is slug, resolve using in-memory slug matching
        // (Since labour_law_updates table does not have a slug column)
        if (page_type === 'labour_law_update' && refIdStr && isNaN(Number(refIdStr))) {
            const updates = await db_1.default.query('SELECT id, title FROM labour_law_updates');
            const match = updates.rows.find(u => slugify(u.title) === refIdStr);
            if (match) {
                refIdStr = match.id.toString();
            }
        }
        const query = refIdStr
            ? 'SELECT * FROM seo_meta WHERE page_type = $1 AND page_reference_id = $2 AND status = $3'
            : 'SELECT * FROM seo_meta WHERE page_type = $1 AND page_reference_id IS NULL AND status = $2';
        const params = refIdStr ? [page_type, refIdStr, 'published'] : [page_type, 'published'];
        const result = await db_1.default.query(query, params);
        res.json(result.rows[0] || null);
    }
    catch (err) {
        console.error('SEO PUBLIC FETCH ERROR:', err.message);
        res.status(500).json({
            message: 'Internal server error fetching public SEO',
            error: err.message
        });
    }
};
exports.getSEOPublic = getSEOPublic;
// ADMIN: Delete SEO
const deleteSEO = async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.default.query('DELETE FROM seo_meta WHERE id = $1', [id]);
        res.json({ message: 'SEO record deleted' });
    }
    catch (err) {
        console.error('Error deleting SEO:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteSEO = deleteSEO;
// ADMIN: Get Discovery (All dynamic pages)
const getSEODiscovery = async (req, res) => {
    try {
        const [services, blogs, labourUpdates] = await Promise.all([
            db_1.default.query('SELECT slug as id, title as label FROM services ORDER BY title ASC'),
            db_1.default.query('SELECT id::text, title as label FROM blogs ORDER BY title ASC'),
            db_1.default.query('SELECT id::text, title as label FROM labour_law_updates ORDER BY release_date DESC')
        ]);
        const discovery = [
            { id: 'home', label: 'Home', type: 'static', reference_id: null },
            { id: 'about', label: 'About Us', type: 'static', reference_id: null },
            { id: 'services_main', label: 'Services', type: 'static', reference_id: null },
            {
                id: 'services_detailed',
                label: 'Services Detailed',
                type: 'collection',
                reference_id: null,
                children: services.rows.map(s => ({
                    id: `service-${s.id}`,
                    label: s.label,
                    type: 'service', // This maps to page_type in DB
                    reference_id: s.id // This maps to page_reference_id in DB (slug for services?)
                    // Wait, service table uses ID or Slug for referencing?
                    // Previous code used s.id for reference_id. 
                    // Let's check service.routes or controller. 
                    // However, standard is usually ID. 
                    // Previous code: reference_id: s.id. 
                    // But query above selects slug as id? 
                    // "SELECT slug as id...". 
                    // If I look at previous code: "reference_id: s.id". 
                    // Let's check the query again. It was "SELECT slug as id...". 
                    // So s.id IS THE SLUG. 
                    // Okay, so reference_id will be the slug.
                }))
            },
            { id: 'wage_calculator', label: 'Wage Calculator', type: 'static', reference_id: null },
            { id: 'testimonials', label: 'Testimonials', type: 'static', reference_id: null },
            { id: 'resources_main', label: 'Resources', type: 'static', reference_id: null },
            {
                id: 'labour_law_updates',
                label: 'Labour Law Updates',
                type: 'collection',
                reference_id: null,
                children: labourUpdates.rows.map(l => ({
                    id: `labour-${l.id}`,
                    label: l.label,
                    type: 'labour_law_update',
                    reference_id: l.id
                }))
            },
            {
                id: 'blogs',
                label: 'Blogs',
                type: 'collection',
                reference_id: null,
                children: blogs.rows.map(b => ({
                    id: `blog-${b.id}`,
                    label: b.label,
                    type: 'blog',
                    reference_id: b.id
                }))
            },
            { id: 'contact', label: 'Contact', type: 'static', reference_id: null },
            { id: 'privacy_policy', label: 'Privacy Policy', type: 'static', reference_id: null },
            { id: 'terms_of_service', label: 'Terms of Service', type: 'static', reference_id: null }
        ];
        res.json(discovery);
    }
    catch (err) {
        console.error('SEO DISCOVERY ERROR:', err.message);
        res.status(500).json({
            message: 'Internal server error doing SEO discovery',
            error: err.message
        });
    }
};
exports.getSEODiscovery = getSEODiscovery;
