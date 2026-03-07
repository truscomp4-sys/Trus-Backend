"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renameCategory = exports.updateServiceCategories = exports.getServiceCategories = exports.deleteService = exports.upsertService = exports.getServiceBySlug = exports.getAllServices = void 0;
const db_1 = __importDefault(require("../config/db"));
// PUBLIC & ADMIN: Get all services
const getAllServices = async (req, res) => {
    try {
        const { public_view } = req.query;
        let query = `
            SELECT 
                id, slug, title, 
                category, 
                short_overview as overview, 
                doodle_type, is_visible, sort_order 
            FROM services
        `;
        if (public_view === 'true') {
            query += ' WHERE is_visible = true';
        }
        query += ' ORDER BY sort_order ASC, id ASC';
        const result = await db_1.default.query(query);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error fetching services:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllServices = getAllServices;
// PUBLIC: Get service detail by slug
const getServiceBySlug = async (req, res) => {
    const { slug } = req.params;
    try {
        const serviceResult = await db_1.default.query(`
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
        const [problems, features, benefits, whyTrusComp] = await Promise.all([
            db_1.default.query('SELECT problem_text FROM service_problems WHERE service_id = $1 ORDER BY sort_order ASC', [serviceId]),
            db_1.default.query('SELECT title, hint FROM service_features WHERE service_id = $1 ORDER BY sort_order ASC', [serviceId]),
            db_1.default.query('SELECT keyword, text FROM service_benefits WHERE service_id = $1 ORDER BY sort_order ASC', [serviceId]),
            db_1.default.query('SELECT point_text FROM service_why_truscomp WHERE service_id = $1 ORDER BY sort_order ASC', [serviceId])
        ]);
        res.json({
            ...service,
            problems: problems.rows.map(r => r.problem_text),
            features: features.rows,
            benefits: benefits.rows,
            whyTrusComp: whyTrusComp.rows.map(r => r.point_text)
        });
    }
    catch (err) {
        console.error('Error fetching service detail:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getServiceBySlug = getServiceBySlug;
// ADMIN: Upsert service and related data
const upsertService = async (req, res) => {
    try {
        const { id, title, categoryId, category, shortOverview, short_overview, longOverview, long_overview, doodleType, doodle_type, state, isActive, is_visible, sort_order, commonProblems, problems, features, benefits, whyTruscomp, whyTrusComp } = req.body;
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
            .replace(/[^\w\s-]/g, '') // Remove special chars
            .replace(/[\s_]+/g, '-') // Spaces/underscores to hyphens
            .replace(/-+/g, '-') // Double hyphens to single
            .replace(/^-+|-+$/g, ''); // Trim hyphens
        let slug = baseSlug;
        const safe_id = (id && id !== 0 && id !== "0" && id !== "null") ? parseInt(id) : null;
        let counter = 1;
        while (true) {
            const checkResult = await db_1.default.query('SELECT id FROM services WHERE slug = $1 AND id != $2', [slug, safe_id || -1]);
            if (checkResult.rowCount === 0)
                break;
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
            benefits: benefits ?? []
        };
        await db_1.default.query('BEGIN');
        const serviceResult = await db_1.default.query(`
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
        await db_1.default.query('DELETE FROM service_problems WHERE service_id = $1', [serviceId]);
        await db_1.default.query('DELETE FROM service_features WHERE service_id = $1', [serviceId]);
        await db_1.default.query('DELETE FROM service_benefits WHERE service_id = $1', [serviceId]);
        await db_1.default.query('DELETE FROM service_why_truscomp WHERE service_id = $1', [serviceId]);
        if (Array.isArray(data.common_problems)) {
            for (let i = 0; i < data.common_problems.length; i++) {
                const p = data.common_problems[i];
                if (p)
                    await db_1.default.query('INSERT INTO service_problems (service_id, problem_text, sort_order) VALUES ($1, $2, $3)', [serviceId, p, i]);
            }
        }
        if (Array.isArray(data.features)) {
            for (let i = 0; i < data.features.length; i++) {
                const f = data.features[i];
                if (f.title)
                    await db_1.default.query('INSERT INTO service_features (service_id, title, hint, sort_order) VALUES ($1, $2, $3, $4)', [serviceId, f.title, f.hint || "", i]);
            }
        }
        if (Array.isArray(data.benefits)) {
            for (let i = 0; i < data.benefits.length; i++) {
                const b = data.benefits[i];
                if (b.keyword)
                    await db_1.default.query('INSERT INTO service_benefits (service_id, keyword, text, sort_order) VALUES ($1, $2, $3, $4)', [serviceId, b.keyword, b.text || "", i]);
            }
        }
        if (Array.isArray(data.why_truscomp)) {
            for (let i = 0; i < data.why_truscomp.length; i++) {
                const w = data.why_truscomp[i];
                if (w)
                    await db_1.default.query('INSERT INTO service_why_truscomp (service_id, point_text, sort_order) VALUES ($1, $2, $3)', [serviceId, w, i]);
            }
        }
        await db_1.default.query('COMMIT');
        res.json({ message: 'Service upserted successfully', id: serviceId });
    }
    catch (err) {
        if (db_1.default)
            await db_1.default.query('ROLLBACK');
        console.error('SERVICE UPSERT ERROR:', err);
        res.status(500).json({
            message: 'Internal server error during save',
            error: err.message
        });
    }
};
exports.upsertService = upsertService;
// ADMIN: Delete a service
const deleteService = async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.default.query('DELETE FROM services WHERE id = $1', [id]);
        res.json({ message: 'Service deleted successfully' });
    }
    catch (err) {
        console.error('Error deleting service:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteService = deleteService;
// ADMIN: Get category list from settings
const getServiceCategories = async (req, res) => {
    try {
        const result = await db_1.default.query("SELECT value FROM settings WHERE key = 'service_categories'");
        if (result.rowCount === 0) {
            return res.json(["Labor law Compliance", "Audit & Verification", "Licensing & Registration", "Industrial Relations", "Payroll & Remittances"]);
        }
        res.json(result.rows[0].value);
    }
    catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getServiceCategories = getServiceCategories;
// ADMIN: Update entire category list
const updateServiceCategories = async (req, res) => {
    const { categories } = req.body;
    if (!Array.isArray(categories)) {
        return res.status(400).json({ message: 'Categories must be an array' });
    }
    try {
        await db_1.default.query(`
            INSERT INTO settings (key, value)
            VALUES ('service_categories', $1)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `, [JSON.stringify(categories)]);
        res.json({ message: 'Categories updated successfully' });
    }
    catch (err) {
        console.error('Error updating categories:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateServiceCategories = updateServiceCategories;
// ADMIN: Rename a category across all services and master list
const renameCategory = async (req, res) => {
    const { oldName, newName } = req.body;
    if (!oldName || !newName) {
        return res.status(400).json({ message: 'Old name and new name are required' });
    }
    try {
        await db_1.default.query('BEGIN');
        // 1. Update all services
        await db_1.default.query('UPDATE services SET category = $2 WHERE category = $1', [oldName, newName]);
        // 2. Update master list in settings
        const result = await db_1.default.query("SELECT value FROM settings WHERE key = 'service_categories'");
        if ((result.rowCount || 0) > 0) {
            let categories = result.rows[0].value;
            if (Array.isArray(categories)) {
                categories = categories.map((c) => c === oldName ? newName : c);
                await db_1.default.query("UPDATE settings SET value = $1 WHERE key = 'service_categories'", [JSON.stringify(categories)]);
            }
        }
        await db_1.default.query('COMMIT');
        res.json({ message: 'Category renamed successfully' });
    }
    catch (err) {
        await db_1.default.query('ROLLBACK');
        console.error('Error renaming category:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.renameCategory = renameCategory;
