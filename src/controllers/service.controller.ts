import { Request, Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// PUBLIC & ADMIN: Get all services
export const getAllServices = async (req: Request, res: Response) => {
    try {
        const { public_view, status } = req.query;
        let query = `
            SELECT 
                id, slug, title, 
                category, 
                short_overview as overview, 
                doodle_type, is_visible, sort_order 
            FROM services
        `;

        const conditions: string[] = [];

        if (public_view === 'true') {
            conditions.push('is_visible = true');
        }

        // Handle Status Filter
        const statusValue = typeof status === 'string' ? status.trim().toLowerCase() : null;
        if (statusValue === 'active') {
            conditions.push('is_visible = true');
        } else if (statusValue === 'inactive') {
            conditions.push('is_visible = false');
        } else if (statusValue === 'all') {
            // Show all
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY sort_order ASC, id ASC';

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching services:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// PUBLIC: Get service detail by slug
export const getServiceBySlug = async (req: Request, res: Response) => {
    const { slug } = req.params;

    try {
        const serviceResult = await pool.query(`
            SELECT 
                s.*,
                s.category,
                s.short_overview as overview
            FROM services s 
            WHERE s.slug = $1
        `, [slug]);

        if (serviceResult.rowCount === 0) {
            return res.status(404).json({ message: 'Service not found' });
        }

        const service = serviceResult.rows[0];
        const serviceId = service.id;

        const [problems, features, benefits, whyTrusComp, faqs] = await Promise.all([
            pool.query('SELECT problem_text FROM service_problems WHERE service_id = $1 ORDER BY sort_order ASC', [serviceId]),
            pool.query('SELECT title, hint FROM service_features WHERE service_id = $1 ORDER BY sort_order ASC', [serviceId]),
            pool.query('SELECT keyword, text FROM service_benefits WHERE service_id = $1 ORDER BY sort_order ASC', [serviceId]),
            pool.query('SELECT point_text FROM service_why_truscomp WHERE service_id = $1 ORDER BY sort_order ASC', [serviceId]),
            pool.query('SELECT question, answer FROM service_faqs WHERE service_id = $1 ORDER BY sort_order ASC', [serviceId])
        ]);

        res.json({
            ...service,
            problems: problems.rows.map(r => r.problem_text),
            features: features.rows,
            benefits: benefits.rows,
            whyTrusComp: whyTrusComp.rows.map(r => r.point_text),
            faqs: faqs.rows
        });
    } catch (err) {
        console.error('Error fetching service detail:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ADMIN: Upsert service and related data
export const upsertService = async (req: AuthRequest, res: Response) => {
    try {
        const {
            id, title, categoryId, category,
            shortOverview, short_overview,
            longOverview, long_overview,
            doodleType, doodle_type,
            state,
            isActive, is_visible,
            sort_order,
            commonProblems, problems,
            features,
            benefits,
            whyTruscomp, whyTrusComp,
            faqs
        } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const final_category_id = categoryId || category;
        if (!final_category_id) {
            return res.status(400).json({ message: 'Category is required' });
        }

        // 1. Generate Unique Slug
        const baseSlug = title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')     // Remove special chars
            .replace(/[\s_]+/g, '-')       // Spaces/underscores to hyphens
            .replace(/-+/g, '-')           // Double hyphens to single
            .replace(/^-+|-+$/g, '');     // Trim hyphens

        let slug = baseSlug;
        const safe_id = (id && id !== 0 && id !== "0" && id !== "null") ? parseInt(id) : null;

        let counter = 1;
        while (true) {
            const checkResult = await pool.query(
                'SELECT id FROM services WHERE slug = $1 AND id != $2',
                [slug, safe_id || -1]
            );
            if (checkResult.rowCount === 0) break;
            slug = `${baseSlug}-${counter++}`;
        }

        // 2. Defensive Payload Mapping
        const data = {
            id: safe_id,
            slug,
            title,
            category: final_category_id,
            short_overview: shortOverview ?? short_overview ?? "",
            long_overview: longOverview ?? long_overview ?? "",
            state: state ?? "Central",
            doodle_type: doodleType ?? doodle_type ?? "shield",
            is_visible: isActive ?? is_visible ?? true,
            sort_order: parseInt(sort_order) || 0,
            common_problems: commonProblems ?? problems ?? [],
            why_truscomp: whyTruscomp ?? whyTrusComp ?? [],
            features: features ?? [],
            benefits: benefits ?? [],
            faqs: faqs ?? []
        };

        await pool.query('BEGIN');

        const serviceResult = await pool.query(`
            INSERT INTO services (id, slug, title, category, short_overview, long_overview, doodle_type, state, is_visible, sort_order, updated_at)
            VALUES (COALESCE($1, nextval('services_id_seq')), $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            ON CONFLICT (id) 
            DO UPDATE SET 
                slug = EXCLUDED.slug,
                title = EXCLUDED.title,
                category = EXCLUDED.category,
                short_overview = EXCLUDED.short_overview,
                long_overview = EXCLUDED.long_overview,
                doodle_type = EXCLUDED.doodle_type,
                state = EXCLUDED.state,
                is_visible = EXCLUDED.is_visible,
                sort_order = EXCLUDED.sort_order,
                updated_at = NOW()
            RETURNING id
        `, [
            data.id, data.slug, data.title, data.category,
            data.short_overview, data.long_overview,
            data.doodle_type, data.state, data.is_visible, data.sort_order
        ]);

        const serviceId = serviceResult.rows[0].id;

        // Clean and update related tables
        await pool.query('DELETE FROM service_problems WHERE service_id = $1', [serviceId]);
        await pool.query('DELETE FROM service_features WHERE service_id = $1', [serviceId]);
        await pool.query('DELETE FROM service_benefits WHERE service_id = $1', [serviceId]);
        await pool.query('DELETE FROM service_why_truscomp WHERE service_id = $1', [serviceId]);
        await pool.query('DELETE FROM service_faqs WHERE service_id = $1', [serviceId]);

        if (Array.isArray(data.common_problems)) {
            for (let i = 0; i < data.common_problems.length; i++) {
                const p = data.common_problems[i];
                if (p) await pool.query('INSERT INTO service_problems (service_id, problem_text, sort_order) VALUES ($1, $2, $3)', [serviceId, p, i]);
            }
        }

        if (Array.isArray(data.features)) {
            for (let i = 0; i < data.features.length; i++) {
                const f = data.features[i];
                if (f.title) await pool.query('INSERT INTO service_features (service_id, title, hint, sort_order) VALUES ($1, $2, $3, $4)', [serviceId, f.title, f.hint || "", i]);
            }
        }

        if (Array.isArray(data.benefits)) {
            for (let i = 0; i < data.benefits.length; i++) {
                const b = data.benefits[i];
                if (b.keyword) await pool.query('INSERT INTO service_benefits (service_id, keyword, text, sort_order) VALUES ($1, $2, $3, $4)', [serviceId, b.keyword, b.text || "", i]);
            }
        }

        if (Array.isArray(data.why_truscomp)) {
            for (let i = 0; i < data.why_truscomp.length; i++) {
                const w = data.why_truscomp[i];
                if (w) await pool.query('INSERT INTO service_why_truscomp (service_id, point_text, sort_order) VALUES ($1, $2, $3)', [serviceId, w, i]);
            }
        }

        if (Array.isArray(data.faqs)) {
            for (let i = 0; i < data.faqs.length; i++) {
                const q = data.faqs[i];
                if (q.question && q.answer) {
                    await pool.query('INSERT INTO service_faqs (service_id, question, answer, sort_order) VALUES ($1, $2, $3, $4)', [serviceId, q.question, q.answer, i]);
                }
            }
        }

        await pool.query('COMMIT');
        res.json({ message: 'Service upserted successfully', id: serviceId });
    } catch (err: any) {
        if (pool) await pool.query('ROLLBACK');
        console.error('SERVICE UPSERT ERROR:', err);
        res.status(500).json({
            message: 'Internal server error during save',
            error: err.message
        });
    }
};

// ADMIN: Delete a service
export const deleteService = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM services WHERE id = $1', [id]);
        res.json({ message: 'Service deleted successfully' });
    } catch (err) {
        console.error('Error deleting service:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
// ADMIN: Get category list from settings
export const getServiceCategories = async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT value FROM settings WHERE key = 'service_categories'");
        if (result.rowCount === 0) {
            return res.json(["Labor law Compliance", "Audit & Verification", "Licensing & Registration", "Industrial Relations", "Payroll & Remittances"]);
        }
        res.json(result.rows[0].value);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ADMIN: Update entire category list
export const updateServiceCategories = async (req: AuthRequest, res: Response) => {
    const { categories } = req.body;
    if (!Array.isArray(categories)) {
        return res.status(400).json({ message: 'Categories must be an array' });
    }

    try {
        await pool.query(`
            INSERT INTO settings (key, value)
            VALUES ('service_categories', $1)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `, [JSON.stringify(categories)]);
        res.json({ message: 'Categories updated successfully' });
    } catch (err) {
        console.error('Error updating categories:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ADMIN: Rename a category across all services and master list
export const renameCategory = async (req: AuthRequest, res: Response) => {
    const { oldName, newName } = req.body;

    if (!oldName || !newName) {
        return res.status(400).json({ message: 'Old name and new name are required' });
    }

    try {
        await pool.query('BEGIN');

        // 1. Update all services
        await pool.query('UPDATE services SET category = $2 WHERE category = $1', [oldName, newName]);

        // 2. Update master list in settings
        const result = await pool.query("SELECT value FROM settings WHERE key = 'service_categories'");
        if ((result.rowCount || 0) > 0) {
            let categories = result.rows[0].value;
            if (Array.isArray(categories)) {
                categories = categories.map((c: string) => c === oldName ? newName : c);
                await pool.query("UPDATE settings SET value = $1 WHERE key = 'service_categories'", [JSON.stringify(categories)]);
            }
        }

        await pool.query('COMMIT');
        res.json({ message: 'Category renamed successfully' });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error renaming category:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
