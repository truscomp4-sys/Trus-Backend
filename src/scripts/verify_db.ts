import pool from '../config/db';

const verify = async () => {
    try {
        console.log("Verifying Database Content...");

        const services = await pool.query('SELECT COUNT(*) FROM services');
        const servicesVisible = await pool.query('SELECT COUNT(*) FROM services WHERE is_visible = true');

        const updates = await pool.query('SELECT COUNT(*) FROM labour_law_updates');
        const updatesVisible = await pool.query('SELECT COUNT(*) FROM labour_law_updates WHERE is_visible = true');

        const blogs = await pool.query('SELECT COUNT(*) FROM blogs');
        const blogsVisible = await pool.query('SELECT COUNT(*) FROM blogs WHERE is_visible = true');

        const enquiries = await pool.query('SELECT COUNT(*) FROM enquiries');

        console.log("--- RESULTS ---");
        console.log(`Services: Total=${services.rows[0].count}, Visible=${servicesVisible.rows[0].count}`);
        console.log(`Updates: Total=${updates.rows[0].count}, Visible=${updatesVisible.rows[0].count}`);
        console.log(`Blogs: Total=${blogs.rows[0].count}, Visible=${blogsVisible.rows[0].count}`);
        console.log(`Enquiries: Total=${enquiries.rows[0].count}`);

        process.exit(0);
    } catch (err) {
        console.error("Verification Failed:", err);
        process.exit(1);
    }
};

verify();
