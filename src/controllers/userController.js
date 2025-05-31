import { eq } from 'drizzle-orm';
import db from '../db.js';
import { users, clubs } from '../models/schema.js';
import { getFileUrl, deleteFile } from '../utils/fileUploadService.js';

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users 👨🏻‍💻]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 */
export const getUserProfile = async(req, res) => {
    try {
        const userId = req.user.id;

        const user = await db.select({
                id: users.id,
                name: users.name,
                surname: users.surname,
                email: users.email,
                role: users.role,
                phone: users.phone,
                gender: users.gender,
                birthDate: users.birthDate,
                clubName: users.clubName,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            })
            .from(users)
            .where(eq(users.id, userId))
            .get();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'head_admin') {
            const club = await db.select().from(clubs).where(eq(clubs.headId, userId)).get();
            if (club) {
                user.clubInfo = {
                    id: club.id,
                    name: club.name,
                    goal: club.goal,
                    description: club.description
                };
            }
        }

        delete user.password;

        return res.status(200).json(user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Users 👨🏻‍💻]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               phone:
 *                 type: string
 *               gender:
 *                 type: string
 *               birthDate:
 *                 type: string
 *               clubName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
export const updateUserProfile = async(req, res) => {
    try {
        const userId = req.user.id;
        const profileImage = req.file ? getFileUrl(req.file.filename) : null;

        const {
            name,
            surname,
            phone,
            gender,
            birthDate
        } = req.body;

        const user = await db.select().from(users).where(eq(users.id, userId)).get();

        if (!user) {
            if (req.file) {
                deleteFile(req.file.filename);
            }
            return res.status(404).json({ message: 'User not found' });
        }

        // If there's a new profile image and the user had an old one, delete it
        if (profileImage && user.profileImage) {
            const oldImagePath = user.profileImage.split('/').pop();
            deleteFile(oldImagePath);
        }

        await db.update(users)
            .set({
                name: name || user.name,
                surname: surname || user.surname,
                phone: phone || user.phone,
                gender: gender || user.gender,
                birthDate: birthDate || user.birthDate,
                profileImage: profileImage || user.profileImage,
                updatedAt: new Date()
            })
            .where(eq(users.id, userId))
            .run();

        return res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        if (req.file) {
            deleteFile(req.file.filename);
        }
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (admin only)
 *     tags: [Users 👨🏻‍💻]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User profile data
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
export const getUserById = async(req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const userId = req.params.id;

        const user = await db.select({
                id: users.id,
                name: users.name,
                surname: users.surname,
                email: users.email,
                role: users.role,
                phone: users.phone,
                gender: users.gender,
                birthDate: users.birthDate,
                clubName: users.clubName,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            })
            .from(users)
            .where(eq(users.id, userId))
            .get();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'head_admin') {
            const club = await db.select().from(clubs).where(eq(clubs.headId, userId)).get();
            if (club) {
                user.clubInfo = {
                    id: club.id,
                    name: club.name,
                    goal: club.goal,
                    description: club.description
                };
            }
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users 👨🏻‍💻]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Unauthorized
 */
export const getAllUsers = async(req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const allUsers = await db.select({
                id: users.id,
                name: users.name,
                surname: users.surname,
                email: users.email,
                role: users.role,
                createdAt: users.createdAt,
            })
            .from(users)
            .all();

        return res.status(200).json(allUsers);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Update user role (admin only)
 *     tags: [Users 👨🏻‍💻]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [student, head_admin, super_admin]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
export const updateUserRole = async(req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const userId = req.params.id;
        const { role } = req.body;

        if (!['student', 'head_admin', 'super_admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await db.select().from(users).where(eq(users.id, userId)).get();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await db.update(users)
            .set({
                role,
                updatedAt: new Date()
            })
            .where(eq(users.id, userId))
            .run();

        return res.status(200).json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}