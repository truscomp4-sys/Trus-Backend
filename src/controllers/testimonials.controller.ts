import { Request, Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// PUBLIC & ADMIN: Get all testimonials
export const getAllTestimonials = async (req: Request, res: Response) => {
    try {
        const { public_view } = req.query;
        let query = 'SELECT * FROM testimonials';
        if (public_view === 'true') {
            query += ' WHERE is_visible = true';
        }
        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching testimonials:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ADMIN: Upsert testimonial
export const upsertTestimonial = async (req: AuthRequest, res: Response) => {
    const {
        id, quote, client_name, designation, company, engagement_type, rating, image_url, is_visible
    } = req.body;

    if (!quote || !client_name) {
        return res.status(400).json({ message: 'Quote and client name are required' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO testimonials (
                id, quote, client_name, designation, company, engagement_type, rating, image_url, is_visible
            )
            VALUES (COALESCE($1, nextval('testimonials_id_seq')), $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) 
            DO UPDATE SET 
                quote = EXCLUDED.quote,
                client_name = EXCLUDED.client_name,
                designation = EXCLUDED.designation,
                company = EXCLUDED.company,
                engagement_type = EXCLUDED.engagement_type,
                rating = EXCLUDED.rating,
                image_url = EXCLUDED.image_url,
                is_visible = EXCLUDED.is_visible
            RETURNING *
        `, [id || null, quote, client_name, designation, company, engagement_type, rating || 5, image_url || null, is_visible !== undefined ? is_visible : true]);

        res.json(result.rows[0]);
    } catch (err: any) {
        console.error('Error upserting testimonial:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

// ADMIN: Delete testimonial
export const deleteTestimonial = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM testimonials WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }
        res.json({ message: 'Testimonial deleted successfully' });
    } catch (err) {
        console.error('Error deleting testimonial:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// --- Why Choose Us ---

// PUBLIC & ADMIN: Get all why choose us items
export const getAllWhyChooseUs = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM why_choose_us ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching why choose us items:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ADMIN: Upsert why choose us
export const upsertWhyChooseUs = async (req: AuthRequest, res: Response) => {
    const { id, title, description, icon_name } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'Title is required' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO why_choose_us (id, title, description, icon_name)
            VALUES (COALESCE($1, nextval('why_choose_us_id_seq')), $2, $3, $4)
            ON CONFLICT (id) 
            DO UPDATE SET 
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                icon_name = EXCLUDED.icon_name
            RETURNING *
        `, [id || null, title, description, icon_name]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error upserting why choose us item:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ADMIN: Delete why choose us
export const deleteWhyChooseUs = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM why_choose_us WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        console.error('Error deleting item:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
