import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import db from '../db.js';
import { users } from '../models/schema.js';
import { sendEmail, emailTemplates, generateVerificationCode } from '../utils/emailService.js';

// Store verification codes (in production, use Redis or similar)
const verificationCodes = new Map();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth 🔐]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - surname
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input or email already exists
 */
export const register = async(req, res) => {
    try {
        const { name, surname, email, password, phone, gender, birthDate } = req.body;

        const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate verification code
        const verificationCode = generateVerificationCode();
        verificationCodes.set(email, {
            code: verificationCode,
            expires: Date.now() + 10 * 60 * 1000 // 10 minutes
        });

        // Send verification email
        const { subject, html } = emailTemplates.verificationCode(verificationCode);
        await sendEmail(email, subject, null, html);

        const result = await db.insert(users).values({
            name,
            surname,
            email,
            password: hashedPassword,
            role: 'student',
            phone,
            gender,
            birthDate,
            createdAt: new Date(),
            updatedAt: new Date()
        }).run();

        const newUser = await db.select().from(users).where(eq(users.email, email)).get();

        const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET, { expiresIn: '7d' }
        );

        return res.status(201).json({
            message: 'User registered successfully. Please check your email for verification code.',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                surname: newUser.surname,
                email: newUser.email,
                role: newUser.role,
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify user's email
 *     tags: [Auth 🔐]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired code
 */
export const verifyEmail = async(req, res) => {
    try {
        const { email, code } = req.body;

        const verificationData = verificationCodes.get(email);
        if (!verificationData) {
            return res.status(400).json({ message: 'No verification code found for this email' });
        }

        if (Date.now() > verificationData.expires) {
            verificationCodes.delete(email);
            return res.status(400).json({ message: 'Verification code has expired' });
        }

        if (verificationData.code !== code) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        // Code is valid, update user's email verification status
        await db.update(users)
            .set({
                isEmailVerified: true,
                updatedAt: new Date()
            })
            .where(eq(users.email, email))
            .run();

        // Remove used code
        verificationCodes.delete(email);

        return res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth 🔐]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export const login = async(req, res) => {
    try {
        const { email, password } = req.body;

        const user = await db.select().from(users).where(eq(users.email, email)).get();
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET, { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Auth 🔐]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect
 */
export const changePassword = async(req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = await db.select().from(users).where(eq(users.id, userId)).get();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.update(users)
            .set({
                password: hashedPassword,
                updatedAt: new Date()
            })
            .where(eq(users.id, userId))
            .run();

        return res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}