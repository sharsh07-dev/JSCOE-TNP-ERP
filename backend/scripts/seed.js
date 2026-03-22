/**
 * Seed script: Creates default admin and coordinator accounts.
 * Run: node scripts/seed.js
 * Requires: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL in .env
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { initFirebase, getDb } = require('../config/firebase');

const SEED_USERS = [
    {
        name: 'Admin JSCOE',
        email: 'admin@jscoe.ac.in',
        password: 'admin123',
        role: 'admin',
        department: 'Administration',
        college: "JSPM's Jayawantrao Sawant College of Engineering",
    },
    {
        name: 'TNP Coordinator',
        email: 'tnp@jscoe.ac.in',
        password: 'tnp123',
        role: 'coordinator',
        department: 'Training & Placement Cell',
        college: "JSPM's Jayawantrao Sawant College of Engineering",
    },
    {
        name: 'HOD Viewer',
        email: 'hod@jscoe.ac.in',
        password: 'hod123',
        role: 'viewer',
        department: 'Computer Engineering',
        college: "JSPM's Jayawantrao Sawant College of Engineering",
    },
];

async function seed() {
    console.log('🌱 Starting seed...');
    initFirebase();
    const db = getDb();

    for (const user of SEED_USERS) {
        try {
            const existing = await db.collection('users').where('email', '==', user.email).get();
            if (!existing.empty) {
                console.log(`⏭️  ${user.email} already exists, skipping.`);
                continue;
            }

            const uid = uuidv4();
            const hashedPassword = await bcrypt.hash(user.password, 12);

            await db.collection('users').doc(uid).set({
                uid,
                name: user.name,
                email: user.email,
                password: hashedPassword,
                role: user.role,
                department: user.department,
                college: user.college,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            console.log(`✅ Created [${user.role}]: ${user.email} / ${user.password}`);
        } catch (err) {
            console.error(`❌ Failed to create ${user.email}:`, err.message);
        }
    }

    console.log('\n🎉 Seed complete! You can now login with the above credentials.\n');
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
