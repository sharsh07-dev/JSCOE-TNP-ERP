const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { getDb } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

// ── Email transporter (uses env vars) ──────────────────────────────────────
const createTransporter = () => nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Register user
const register = async (req, res) => {
    try {
        const { name, email, password, role, department, college } = req.body;
        const db = getDb();

        // Check if email already exists
        const existing = await db.collection('users').where('email', '==', email).get();
        if (!existing.empty) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const uid = uuidv4();

        const userData = {
            uid,
            name,
            email,
            password: hashedPassword,
            role: role || 'viewer', // admin | coordinator | viewer
            department: department || '',
            college: college || '',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await db.collection('users').doc(uid).set(userData);

        const token = jwt.sign({ uid }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
        const { password: _, ...userWithoutPassword } = userData;

        res.status(201).json({ token, user: userWithoutPassword });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = getDb();

        const snapshot = await db.collection('users').where('email', '==', email).get();
        if (snapshot.empty) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        if (!userData.isActive) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        const isValid = await bcrypt.compare(password, userData.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ uid: userData.uid }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE,
        });

        const { password: _, ...userWithoutPassword } = userData;
        res.json({ token, user: userWithoutPassword });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
};

// Get current user
const getMe = async (req, res) => {
    try {
        const { password: _, ...userWithoutPassword } = req.user;
        res.json(userWithoutPassword);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
    try {
        const db = getDb();
        const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
        const users = snapshot.docs.map((doc) => {
            const { password, ...rest } = doc.data();
            return rest;
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Update user role (admin only)
const updateUser = async (req, res) => {
    try {
        const { uid } = req.params;
        const { role, isActive, name, department } = req.body;
        const db = getDb();

        const updates = { updatedAt: new Date().toISOString() };
        if (role !== undefined) updates.role = role;
        if (isActive !== undefined) updates.isActive = isActive;
        if (name !== undefined) updates.name = name;
        if (department !== undefined) updates.department = department;

        await db.collection('users').doc(uid).update(updates);
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user' });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const db = getDb();

        const userDoc = await db.collection('users').doc(req.user.uid).get();
        const userData = userDoc.data();

        const isValid = await bcrypt.compare(currentPassword, userData.password);
        if (!isValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await db.collection('users').doc(req.user.uid).update({
            password: hashedPassword,
            updatedAt: new Date().toISOString(),
        });

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to change password' });
    }
};

// Forgot Password — generates reset token and emails the user
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const db = getDb();
        const snapshot = await db.collection('users').where('email', '==', email).get();
        if (snapshot.empty) {
            // Return 200 even if not found (security best practice)
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        // Generate a secure token and compute expiry (1 hour)
        const resetToken = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        await db.collection('passwordResets').doc(resetToken).set({
            uid: userData.uid,
            email,
            expiresAt,
            used: false,
            createdAt: new Date().toISOString(),
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        // Send email
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = createTransporter();
            await transporter.sendMail({
                from: `"JSCOE TNP Cell" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Password Reset Request — JSCOE TNP ERP',
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
                        <div style="background:#1d4ed8;padding:24px 32px">
                            <h2 style="color:#ffffff;margin:0;font-size:20px">JSCOE TNP Cell — Password Reset</h2>
                        </div>
                        <div style="padding:32px">
                            <p style="color:#334155;font-size:15px">Hi <strong>${userData.name || 'User'}</strong>,</p>
                            <p style="color:#334155;font-size:14px">We received a request to reset the password for your TNP ERP account.</p>
                            <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:14px 28px;background:#1d4ed8;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px">
                                Reset My Password
                            </a>
                            <p style="color:#64748b;font-size:12px">This link expires in <strong>1 hour</strong>. If you did not request a password reset, ignore this email.</p>
                            <p style="color:#94a3b8;font-size:11px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:16px">
                                JSPM's Jayawantrao Sawant College of Engineering — Training &amp; Placement Cell
                            </p>
                        </div>
                    </div>
                `,
            });
        } else {
            console.log('⚠️  EMAIL_USER/EMAIL_PASS not set. Reset link:', resetUrl);
        }

        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        console.error('forgotPassword error:', err);
        res.status(500).json({ error: 'Failed to send reset email' });
    }
};

// Reset Password — verifies token and sets new password
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
        if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        const db = getDb();
        const tokenDoc = await db.collection('passwordResets').doc(token).get();
        if (!tokenDoc.exists) return res.status(400).json({ error: 'Invalid or expired reset link' });

        const tokenData = tokenDoc.data();
        if (tokenData.used) return res.status(400).json({ error: 'Reset link has already been used' });
        if (new Date(tokenData.expiresAt) < new Date()) return res.status(400).json({ error: 'Reset link has expired' });

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await db.collection('users').doc(tokenData.uid).update({
            password: hashedPassword,
            updatedAt: new Date().toISOString(),
        });

        // Mark token as used
        await db.collection('passwordResets').doc(token).update({ used: true });

        res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
        console.error('resetPassword error:', err);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};

module.exports = { register, login, getMe, getAllUsers, updateUser, changePassword, forgotPassword, resetPassword };
