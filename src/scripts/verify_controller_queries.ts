import pool from '../config/db';

const verifyQueries = async () => {
    try {
        console.log("Verifying Controller Queries...");

        // 1. Services
        const p1 = pool.query("SELECT COUNT(*) FROM services WHERE is_visible = true");

        // 2. Labour Laws
        const p2 = pool.query("SELECT COUNT(*) as count, MAX(updated_at) as last_updated FROM labour_law_updates WHERE is_visible = true");

        // 3. Blogs
        const p3 = pool.query("SELECT COUNT(*) as count, MAX(created_at) as last_updated FROM blogs WHERE is_visible = true");

        // 4. Enquiries Total
        const p4 = pool.query('SELECT COUNT(*) FROM enquiries');

        // 5. Chart Data (Test with broad range)
        const now = new Date();
        const start = new Date(now.getFullYear() - 10, 0, 1); // 10 years ago
        const end = new Date();
        const p5 = pool.query(
            `SELECT status, COUNT(*) as count 
             FROM enquiries 
             WHERE created_at >= $1 AND created_at <= $2
             GROUP BY status`,
            [start, end]
        );

        // 6. Recent Enquiries
        const p6 = pool.query(
            `SELECT id, name, service_interest, created_at, status 
             FROM enquiries 
             ORDER BY created_at DESC 
             LIMIT 4`
        );

        const [r1, r2, r3, r4, r5, r6] = await Promise.all([p1, p2, p3, p4, p5, p6]);

        console.log("--- SUCCESS ---");
        console.log("Services:", r1.rows[0]);
        console.log("LabourLaws:", r2.rows[0]);
        console.log("Blogs:", r3.rows[0]);
        console.log("Enquiries:", r4.rows[0]);
        console.log("Chart:", r5.rows);
        console.log("Recent:", r6.rows);

        process.exit(0);

    } catch (err) {
        console.error("--- QUERY FAILURE ---");
        console.error(err);
        process.exit(1);
    }
};

verifyQueries();
