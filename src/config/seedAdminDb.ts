import pool from './db';
import dotenv from 'dotenv';
import path from 'path';

// Note: In a real environment, we might want to import the data from the frontend files.
// However, since we are in a node environment, we will manually define the seed data 
// based on the frontend structure to avoid complexity with ES Modules/TS in node scripts.

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedDb = async () => {
    try {
        console.log('Starting Seeding Process...');

        // 1. Seed Services
        const services = [
            {
                id: 1,
                slug: "labor-law-compliance",
                title: "End-to-End Labor Law Compliance Management",
                category: "operations",
                overview: "Expert-led solutions tailored for businesses across India, leveraging automation for smooth and error-free operations.",
                problems: [
                    "Fragmented compliance tracking across multiple locations.",
                    "High risk of human error in manual reporting.",
                    "Complexity of staying updated with nationwide legal changes."
                ],
                features: [
                    { title: "Centralized Compliance Tracking", hint: "Monitor all activities from a single dashboard." },
                    { title: "Automated Workflows", hint: "Improve efficiency and accuracy, minimizing manual intervention." },
                    { title: "Comprehensive Audits & Assessments", hint: "Identify and address compliance gaps." }
                ],
                benefits: [
                    { keyword: "Risk Mitigation", text: "Minimized operational risks." },
                    { keyword: "Time Savings", text: "Time-saving automation." },
                    { keyword: "Nationwide Adherence", text: "Compliance across all Indian states." }
                ],
                whyTrusComp: [
                    "Unmatched expertise in Indian labor laws.",
                    "Innovative automation tools.",
                    "Proven results with 100+ clients."
                ],
                doodleType: "shield"
            },
            {
                id: 2,
                slug: "compliance-calendar",
                title: "Compliance Calendar",
                category: "automation",
                overview: "Automated calendars designed to track critical timelines and ensure no deadlines are missed. Tailored to business requirements with proactive reminders.",
                problems: [
                    "Missed deadlines leading to heavy penalties.",
                    "Lack of visibility into upcoming statutory obligations.",
                    "Inconsistent tracking across different departments."
                ],
                features: [
                    { title: "Customizable Calendars", hint: "Adapt to specific business needs." },
                    { title: "Proactive Reminders", hint: "Email and SMS notifications for upcoming deadlines." },
                    { title: "Enterprise Integration", hint: "Seamless integration with existing systems." }
                ],
                benefits: [
                    { keyword: "Zero Penalties", text: "Avoidance of late-filing fines." },
                    { keyword: "High Visibility", text: "Enhanced clarity of obligations." },
                    { keyword: "Proactive Mode", text: "Always stay ahead of schedules." }
                ],
                whyTrusComp: [
                    "Custom-tailored solutions based on your industry.",
                    "Proactive notification engine.",
                    "Proven domain expertise."
                ],
                doodleType: "calendar"
            },
            {
                id: 3,
                slug: "records-registers",
                title: "Records & Registers Automation",
                category: "operations",
                overview: "Automated solutions for generating and managing % mandatory records and registers, ensuring 100% statutory adherence.",
                problems: [
                    "Mounting administrative burden from manual data entry.",
                    "High frequency of errors in statutory registers.",
                    "Difficulties in retrieving documents during audits."
                ],
                features: [
                    { title: "Automated Register Generation", hint: "Effortless generation of mandatory records." },
                    { title: "Cloud-Based Storage", hint: "Secure, anytime access to statutory records." },
                    { title: "Audit-Ready System", hint: "Quick and secure access for inspections." }
                ],
                benefits: [
                    { keyword: "100% Adherence", text: "Absolute compliance with statutory acts." },
                    { keyword: "Error-Free", text: "Elimination of manual calculation errors." },
                    { keyword: "Audit Ready", text: "Zero-stress inspection experiences." }
                ],
                whyTrusComp: [
                    "Expert-designed automation for all major acts.",
                    "Bank-grade data security.",
                    "Trusted by industry leaders."
                ],
                doodleType: "records"
            },
            {
                id: 4,
                slug: "remittances-returns",
                title: "Remittances & Returns",
                category: "finance",
                overview: "Automated processes for timely and accurate remittances and returns, reducing administrative overhead across central and state regulations.",
                problems: [
                    "Complex multi-state tax and remittance rules.",
                    "Inaccurate calculations leading to legal scrutiny.",
                    "Delayed filings causing operational friction."
                ],
                features: [
                    { title: "Automated Tracking", hint: "Precise calculation and tracking of obligations." },
                    { title: "Multi-State Adherence", hint: "Compliance with all state labor laws and taxes." },
                    { title: "Real-Time Dashboard", hint: "Monitor filings across multiple locations." }
                ],
                benefits: [
                    { keyword: "Efficiency", text: "Reduced administrative overhead." },
                    { keyword: "Transparency", text: "Clear audit trails for every filing." },
                    { keyword: "Seamlessness", text: "Integration with payroll and finance." }
                ],
                whyTrusComp: [
                    "Precision-first automation.",
                    "Deep understanding of state-specific rules.",
                    "Dedicated support for complex filings."
                ],
                doodleType: "remittance"
            },
            {
                id: 5,
                slug: "licenses-registrations",
                title: "Licenses & Registrations",
                category: "factory",
                overview: "Simplifies licensing and registration processes, ensuring seamless applications, renewals, and amendments with minimal effort.",
                problems: [
                    "Complex documentation for new factory licenses.",
                    "Operational disruptions due to expired registrations.",
                    "Lack of tracking for multiple renewal dates."
                ],
                features: [
                    { title: "Real-Time Tracking", hint: "Stay updated on the status of licensing processes." },
                    { title: "Expert Support", hint: "Assistance with applications and amendments." },
                    { title: "Document Management", hint: "Streamlined storage for easy submission." }
                ],
                benefits: [
                    { keyword: "Continuous Ops", text: "Avoid operational disruptions." },
                    { keyword: "Streamlined", text: "Simplified regulatory requirements." },
                    { keyword: "Accuracy", text: "Expert-verified documentation." }
                ],
                whyTrusComp: [
                    "Tailored solutions for diverse sectors.",
                    "Proactive renewal engine.",
                    "Direct coordination with authorities."
                ],
                doodleType: "license"
            },
            {
                id: 6,
                slug: "inspection-handling",
                title: "Inspection Handling & Audit Appearance",
                category: "audits",
                overview: "Ensures organizations are fully prepared for inspections and audits with expert representation and automated tracking.",
                problems: [
                    "Panic and unpreparedness during surprise inspections.",
                    "Lack of organized evidence for compliance claims.",
                    "High probability of penalties during audits."
                ],
                features: [
                    { title: "Audit Readiness Reports", hint: "On-demand generation of precise documentation." },
                    { title: "Expert Representation", hint: "Professional guidance during inspections." },
                    { title: "Gap Assessment", hint: "Proactively identify and address failings." }
                ],
                benefits: [
                    { keyword: "Confidence", text: "Enhanced audit outcomes." },
                    { keyword: "Stress-Free", text: "Calm navigation of legal inquiries." },
                    { keyword: "Safety", text: "Strong defense against heavy penalties." }
                ],
                whyTrusComp: [
                    "Years of experience in handling inspections.",
                    "Proactive audit-readiness frameworks.",
                    "Expert legal advisors."
                ],
                doodleType: "audit"
            }
        ];

        for (const s of services) {
            const res = await pool.query(`
                INSERT INTO services (id, slug, title, category, overview, doodle_type)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (slug) DO NOTHING
                RETURNING id
            `, [s.id, s.slug, s.title, s.category, s.overview, s.doodleType]);

            if (res.rowCount && res.rowCount > 0) {
                const serviceId = res.rows[0].id;
                for (let i = 0; i < s.problems.length; i++) {
                    await pool.query('INSERT INTO service_problems (service_id, problem_text, sort_order) VALUES ($1, $2, $3)', [serviceId, s.problems[i], i]);
                }
                for (let i = 0; i < s.features.length; i++) {
                    await pool.query('INSERT INTO service_features (service_id, title, hint, sort_order) VALUES ($1, $2, $3, $4)', [serviceId, s.features[i].title, s.features[i].hint, i]);
                }
                for (let i = 0; i < s.benefits.length; i++) {
                    await pool.query('INSERT INTO service_benefits (service_id, keyword, text, sort_order) VALUES ($1, $2, $3, $4)', [serviceId, s.benefits[i].keyword, s.benefits[i].text, i]);
                }
                for (let i = 0; i < s.whyTrusComp.length; i++) {
                    await pool.query('INSERT INTO service_why_truscomp (service_id, point_text, sort_order) VALUES ($1, $2, $3)', [serviceId, s.whyTrusComp[i], i]);
                }
            }
        }
        console.log('Services seeded.');

        // 2. Seed Resources
        const resources = [
            {
                title: "The Code on Wages, 2019",
                description: "An Act to amend and consolidate the laws relating to wages and bonus.",
                release_date: "08 Aug 2019",
                effective_date: "To be notified",
                state: "Central",
                category: "Acts",
                download_url: "#"
            },
            {
                title: "The Industrial Relations Code, 2020",
                description: "Consolidates laws relating to Trade Unions, conditions of employment in industrial establishment or undertaking, investigation and settlement of industrial disputes.",
                release_date: "28 Sep 2020",
                effective_date: "To be notified",
                state: "Central",
                category: "Acts",
                download_url: "#"
            }
        ];

        for (const r of resources) {
            // @ts-ignore - Handle optional fields safely
            await pool.query(`
                INSERT INTO resources (
                    title, description, release_date, effective_date, state,
                    category, download_url, speaker_name, speaker_role, speaker_org
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [r.title, r.description, r.release_date, r.effective_date, r.state, r.category, r.download_url, (r as any).speaker_name || null, (r as any).speaker_role || null, (r as any).speaker_org || null]);
        }
        console.log('Resources seeded.');

        // 3. Seed Compliance Updates
        const complianceUpdates = [
            {
                slug: "pf-wage-ceiling-revision",
                title: "New PF Wage Ceiling Revision",
                summary: "The wage ceiling for PF contribution has been revised with effect from the new financial year.",
                category: "PF",
                date_text: "2 days ago",
                impact: "High Impact",
                action_required: "Immediate Action",
                overview_content: "The Employees' Provident Fund Organisation (EPFO) has announced a significant revision to the wage ceiling for mandatory contributions. This change is designed to expand the social security net for employees across India.",
                what_changed_content: "The previous wage ceiling of ₹15,000 per month has been proposed to be increased to ₹21,000 per month. This means more employees will now fall under the mandatory PF contribution requirement.",
                who_it_impacts_content: "Employers with more than 20 employees and employees earning between ₹15,000 and ₹21,000 who were previously excluded from mandatory PF.",
                what_you_should_do_content: "Update your payroll systems to reflect the new ceiling. Review your employee records to identify newly eligible employees and ensure their enrollment in the EPF scheme before the next billing cycle."
            }
        ];

        for (const cu of complianceUpdates) {
            await pool.query(`
                INSERT INTO compliance_updates (
                    slug, title, summary, category, date_text, impact, 
                    action_required, overview_content, what_changed_content, 
                    who_it_impacts_content, what_you_should_do_content
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (slug) DO NOTHING
            `, [cu.slug, cu.title, cu.summary, cu.category, cu.date_text, cu.impact, cu.action_required, cu.overview_content, cu.what_changed_content, cu.who_it_impacts_content, cu.what_you_should_do_content]);
        }
        console.log('Compliance updates seeded.');

        // 4. Seed Blogs
        const blogs = [
            {
                title: "Understanding the New Code on Wages 2019",
                category: "Compliance",
                date_text: "Dec 12, 2024",
                read_time: "5 min read",
                excerpt: "A comprehensive guide to the key changes introduced in the Code on Wages 2019 and its impact on businesses.",
                image_type: "wages",
                content: "Full content here..."
            }
        ];

        for (const b of blogs) {
            await pool.query(`
                INSERT INTO blogs (title, category, date_text, read_time, excerpt, image_type, content)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [b.title, b.category, b.date_text, b.read_time, b.excerpt, b.image_type, b.content]);
        }
        console.log('Blogs seeded.');

        // 5. Seed Testimonials
        const testimonials = [
            {
                quote: "TrusComp transformed our compliance management. Their automated alerts and detailed audit reports helped us stay ahead of regulatory changes across 5 states.",
                client_name: "Rajesh Kumar",
                designation: "HR Director",
                company: "TechFlow Solutions",
                engagement_type: "Multi-State Compliance Audit"
            }
        ];

        for (const t of testimonials) {
            await pool.query(`
                INSERT INTO testimonials (quote, client_name, designation, company, engagement_type)
                VALUES ($1, $2, $3, $4, $5)
            `, [t.quote, t.client_name, t.designation, t.company, t.engagement_type]);
        }
        console.log('Testimonials seeded.');

        // 6. Seed Why Choose Us
        const whyChooseUs = [
            { title: "Expert Solutions", description: "Backed by decades of legal expertise in Indian Labor Laws.", icon_name: "ShieldCheck" },
            { title: "Innovative Tools", description: "Tech-enabled platforms for real-time tracking and reporting.", icon_name: "Zap" }
        ];

        for (const wc of whyChooseUs) {
            await pool.query(`
                INSERT INTO why_choose_us (title, description, icon_name)
                VALUES ($1, $2, $3)
            `, [wc.title, wc.description, wc.icon_name]);
        }
        console.log('Why Choose Us seeded.');

        // 7. Seed Settings
        const settings = [
            { key: "site_email", value: { email: "contact@truscomp.com" } },
            { key: "site_phone", value: { phone: "+91 44 4900 6000" } },
            { key: "site_address", value: { address: "No 9, Pe Ve Plaza, Lakshmi Nagar, Porur, Chennai - 600116" } },
            { key: "social_links", value: { linkedin: "https://linkedin.com", twitter: "https://twitter.com" } }
        ];

        for (const set of settings) {
            await pool.query(`
                INSERT INTO settings (key, value)
                VALUES ($1, $2)
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
            `, [set.key, set.value]);
        }
        console.log('Settings seeded.');

        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
};

seedDb();
