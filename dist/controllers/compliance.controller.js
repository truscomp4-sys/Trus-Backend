"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComplianceUpdate = exports.upsertComplianceUpdate = exports.getComplianceUpdateBySlug = exports.getAllComplianceUpdates = void 0;
const db_1 = __importDefault(require("../config/db"));
// PUBLIC: Get all compliance updates
const getAllComplianceUpdates = async (req, res) => {
    try {
        const result = await db_1.default.query('SELECT * FROM compliance_updates ORDER BY created_at DESC');
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error fetching compliance updates:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllComplianceUpdates = getAllComplianceUpdates;
// PUBLIC: Get compliance update by slug
const getComplianceUpdateBySlug = async (req, res) => {
    const { slug } = req.params;
    try {
        const result = await db_1.default.query('SELECT * FROM compliance_updates WHERE slug = $1', [slug]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Update not found' });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error fetching compliance update detail:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getComplianceUpdateBySlug = getComplianceUpdateBySlug;
// ADMIN: Upsert compliance update
const upsertComplianceUpdate = async (req, res) => {
    const { id, slug, title, summary, category, state, date_text, impact, action_required, overview_content, what_changed_content, who_it_impacts_content, what_you_should_do_content } = req.body;
    if (!slug || !title) {
        return res.status(400).json({ message: 'Slug and title are required' });
    }
    try {
        const result = await db_1.default.query(`
            INSERT INTO compliance_updates (
                id, slug, title, summary, category, state, date_text, impact, 
                action_required, overview_content, what_changed_content, 
                who_it_impacts_content, what_you_should_do_content
            )
            VALUES (COALESCE($1, nextval('compliance_updates_id_seq')), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (slug) 
            DO UPDATE SET 
                title = EXCLUDED.title,
                summary = EXCLUDED.summary,
                category = EXCLUDED.category,
                state = EXCLUDED.state,
                date_text = EXCLUDED.date_text,
                impact = EXCLUDED.impact,
                action_required = EXCLUDED.action_required,
                overview_content = EXCLUDED.overview_content,
                what_changed_content = EXCLUDED.what_changed_content,
                who_it_impacts_content = EXCLUDED.who_it_impacts_content,
                what_you_should_do_content = EXCLUDED.what_you_should_do_content
            RETURNING *
        `, [id || null, slug, title, summary, category, state, date_text, impact, action_required, overview_content, what_changed_content, who_it_impacts_content, what_you_should_do_content]);
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error upserting compliance update:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};
exports.upsertComplianceUpdate = upsertComplianceUpdate;
// ADMIN: Delete compliance update
const deleteComplianceUpdate = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.default.query('DELETE FROM compliance_updates WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Update not found' });
        }
        res.json({ message: 'Update deleted successfully' });
    }
    catch (err) {
        console.error('Error deleting compliance update:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteComplianceUpdate = deleteComplianceUpdate;
