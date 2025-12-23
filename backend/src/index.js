import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, migrate } from './db.js';
// Make sure this path and file exists: src/utils/email.js
import { sendVerificationCodeEmail } from './utils/email.js'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const REQUIRE_EMAIL_VERIFICATION = false;
const MIN_PASSWORD_LENGTH = Number.parseInt(process.env.MIN_PASSWORD_LENGTH || '8', 10);
const PASSWORD_MIN_LENGTH = Number.isFinite(MIN_PASSWORD_LENGTH) && MIN_PASSWORD_LENGTH > 0 ? MIN_PASSWORD_LENGTH : 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors({
    // IMPORTANT: FRONTEND_URL must be set correctly in Railway variables
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());

// Utility to generate a 6-digit code
function generateVerificationCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function getCredentialError(email, password, { minPasswordLength } = {}) {
    if (!email) return 'Email is required';
    if (!EMAIL_REGEX.test(email)) return 'Enter a valid email address';
    if (!password) return 'Password is required';
    if (minPasswordLength && password.length < minPasswordLength) {
        return `Password must be at least ${minPasswordLength} characters`;
    }
    return null;
}

// ------------------------------------
// 🔐 1. REGISTER Endpoint (/api/register)
// ------------------------------------
app.post('/api/register', async (req, res) => {
    try {
        const { email: rawEmail, password: rawPassword } = req.body || {};
        const email = normalizeEmail(rawEmail);
        const password = typeof rawPassword === 'string' ? rawPassword : '';
        const errorMessage = getCredentialError(email, password, { minPasswordLength: PASSWORD_MIN_LENGTH });
        if (errorMessage) {
            return res.status(400).json({ error: errorMessage });
        }
        
        // Check if user already exists
        const [existing] = await pool.query('SELECT id, is_verified FROM users WHERE email = ?', [email]);

        if (existing.length > 0) {
            const user = existing[0];
            if (!REQUIRE_EMAIL_VERIFICATION) {
                return res.status(409).json({ error: 'Email already registered' });
            }

            if (user.is_verified) {
                // Verified accounts stay protected
                return res.status(409).json({ error: 'Email already registered' });
            }

            // 1. Generate hash, 6-digit verification code, and EXPIRATION TIME
            const passwordHash = await bcrypt.hash(password, 10);
            const verificationCode = generateVerificationCode();
            const expirationTime = new Date(Date.now() + 5 * 60 * 1000); 

            // Unverified account: refresh password + code and resend
            await pool.query(
                `UPDATE users 
                 SET password_hash = ?, verification_code = ?, code_expires_at = ?, is_verified = 0 
                 WHERE id = ?`,
                [passwordHash, verificationCode, expirationTime, user.id]
            );

            sendVerificationCodeEmail(email, verificationCode).catch(err => { 
                console.error('Failed to send verification code email (existing unverified):', err);
            });

            return res.status(200).json({ 
                ok: true,
                userId: user.id,
                message: 'Account pending verification. We refreshed your code and emailed a new one.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        if (REQUIRE_EMAIL_VERIFICATION) {
            const verificationCode = generateVerificationCode();
            const expirationTime = new Date(Date.now() + 5 * 60 * 1000); 

            // 2. Insert user with code, EXPIRATION TIME, and UNVERIFIED status
            // DB Columns used: email, password_hash, verification_code, is_verified, code_expires_at
            const [result] = await pool.query(
                'INSERT INTO users (email, password_hash, verification_code, is_verified, is_admin, code_expires_at) VALUES (?, ?, ?, 0, 0, ?)',
                [email, passwordHash, verificationCode, expirationTime]
            );

            // 3. Send verification email with the code (Non-blocking)
            sendVerificationCodeEmail(email, verificationCode).catch(err => { 
                console.error('Failed to send verification code email:', err);
            });

            return res.status(201).json({ 
                ok: true, 
                userId: result.insertId,
                message: 'Registration successful! Please check your email for the verification code.'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO users (email, password_hash, is_verified, is_admin) VALUES (?, ?, 1, 0)',
            [email, passwordHash]
        );

        res.status(201).json({ 
            ok: true, 
            userId: result.insertId,
            message: 'Registration successful! You can now log in.'
        });

    } catch (err) {
        console.error('[register] error', err);
        // This is where the ER_BAD_FIELD_ERROR crash happens if columns are missing
        res.status(500).json({ error: 'Internal error' });
    }
});

// ------------------------------------
// 🔑 2. LOGIN Endpoint (/api/login)
// ------------------------------------
app.post('/api/login', async (req, res) => {
    try {
        const { email: rawEmail, password: rawPassword } = req.body || {};
        const email = normalizeEmail(rawEmail);
        const password = typeof rawPassword === 'string' ? rawPassword : '';
        const errorMessage = getCredentialError(email, password);
        if (errorMessage) {
            return res.status(400).json({ error: errorMessage });
        }
        
        const [rows] = await pool.query('SELECT id, password_hash, is_verified, is_admin FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if the account is verified (triggers frontend form switch if not)
        if (REQUIRE_EMAIL_VERIFICATION && Number(user.is_verified) === 0) {
            return res.status(403).json({ error: 'Account not verified. Please verify your email.' });
        }

        // TODO: Implement JWT generation here

        res.json({ ok: true, userId: user.id, isAdmin: Boolean(user.is_admin), message: 'Login successful' });
    } catch (err) {
        console.error('[login] error', err);
        res.status(500).json({ error: 'Internal error' });
    }
});


// ------------------------------------
// ✅ 3. VERIFICATION Endpoint (/api/verify-code)
// ------------------------------------
app.post('/api/verify-code', async (req, res) => {
    try {
        if (!REQUIRE_EMAIL_VERIFICATION) {
            return res.status(400).json({ error: 'Email verification is disabled.' });
        }

        const { email: rawEmail, code } = req.body;
        const email = normalizeEmail(rawEmail);
        
        if (!email || !code || code.length !== 6) {
             return res.status(400).json({ error: 'Email and a 6-digit code are required.' });
        }

        // 1. Find the user with the matching email and code, and fetch the expiration timestamp
        const [rows] = await pool.query(
            'SELECT id, is_verified, code_expires_at FROM users WHERE email = ? AND verification_code = ?', 
            [email, code]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid verification code or email.' });
        }

        const user = rows[0];
        const currentTime = new Date();
        const expiresAt = new Date(user.code_expires_at); 

        // 2. CHECK FOR EXPIRATION
        if (user.is_verified === 0 && user.code_expires_at && expiresAt < currentTime) {
            // Code is expired. Invalidate the code and expiration time.
            await pool.query(
                `UPDATE users 
                 SET verification_code = NULL, code_expires_at = NULL 
                 WHERE id = ?`, 
                [user.id]
            );
            return res.status(401).json({ error: 'Verification code has expired. Please request a new code.' });
        }

        if (user.is_verified) {
            return res.status(200).json({ ok: true, message: 'Account is already verified.' });
        }

        // 3. SUCCESS: Verify the user and invalidate the code and expiration time
        await pool.query(
            `UPDATE users 
             SET is_verified = 1, verification_code = NULL, code_expires_at = NULL 
             WHERE id = ?`, 
            [user.id]
        );

        res.json({ ok: true, message: 'Email successfully verified! You can now log in.' });

    } catch (err) {
        console.error('[verify-code] error', err);
        res.status(500).json({ error: 'Internal error during verification.' });
    }
});


// ------------------------------------
// 🔁 4. RESEND CODE Endpoint (/api/resend-code)
// ------------------------------------
app.post('/api/resend-code', async (req, res) => {
    try {
        if (!REQUIRE_EMAIL_VERIFICATION) {
            return res.status(400).json({ error: 'Email verification is disabled.' });
        }

        const { email: rawEmail } = req.body;
        const email = normalizeEmail(rawEmail);
        if (!email) {
            return res.status(400).json({ error: 'Email is required to resend code.' });
        }

        // Check if user exists and is unverified
        const [rows] = await pool.query('SELECT id, is_verified FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Email not found.' });
        }

        const user = rows[0];
        if (user.is_verified) {
            return res.status(200).json({ message: 'Account is already verified.' });
        }

        // 1. Generate new code and new expiration time (5 minutes)
        const newVerificationCode = generateVerificationCode();
        const newExpirationTime = new Date(Date.now() + 5 * 60 * 1000);

        // 2. Update user record with new code and expiration time
        await pool.query(
            `UPDATE users 
             SET verification_code = ?, code_expires_at = ? 
             WHERE id = ?`,
            [newVerificationCode, newExpirationTime, user.id]
        );

        // 3. Send the new code
        sendVerificationCodeEmail(email, newVerificationCode).catch(err => {
            console.error('Failed to send resend code email:', err);
        });

        res.json({ ok: true, message: 'New verification code sent. Check your email.' });

    } catch (err) {
        console.error('[resend-code] error', err);
        res.status(500).json({ error: 'Internal error during resend process.' });
    }
});

// ------------------------------------
// Static Admin Login (served separately from public landing)
// ------------------------------------
// ------------------------------------
// Server Initialization
// ------------------------------------
async function startServer() {
    try {
        // Ensure database migrations run on startup
        await migrate(); 
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect to DB or start server:", error);
        // Exit process if DB connection or server start fails
        process.exit(1); 
    }
}

startServer();
