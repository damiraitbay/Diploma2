import { eq } from 'drizzle-orm';
import db from '../db.js';
import { clubRequests, clubs, users } from '../models/schema.js';

/**
 * @swagger
 * /api/club-requests:
 *   post:
 *     summary: Submit a new club request
 *     tags: [Club Requests 🪩]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - clubName
 *               - goal
 *               - description
 *               - financing
 *               - phone
 *               - communication
 *               - attractionMethods
 *             properties:
 *               title:
 *                 type: string
 *               clubName:
 *                 type: string
 *               goal:
 *                 type: string
 *               description:
 *                 type: string
 *               financing:
 *                 type: string
 *               resources:
 *                 type: string
 *               phone:
 *                 type: string
 *               communication:
 *                 type: string
 *               attractionMethods:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Club request submitted successfully
 *       400:
 *         description: Invalid input
 */
export const createClubRequest = async (req, res) => {
    try {
        const {
            title,
            clubName,
            goal,
            description,
            financing,
            resources,
            phone,
            communication,
            attractionMethods,
            comment
        } = req.body;

        const userId = req.user.id;
        const user = await db.select().from(users).where(eq(users.id, userId)).get();

        await db.insert(clubRequests).values({
            title,
            headId: userId,
            email: user.email,
            phone,
            communication,
            clubName,
            goal,
            description,
            financing,
            resources,
            attractionMethods,
            comment,
            status: 'pending'
        }).run();

        return res.status(201).json({ message: 'Club request submitted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @swagger
 * /api/club-requests:
 *   get:
 *     summary: Get all club requests (admin only)
 *     tags: [Club Requests 🪩]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of club requests
 *       403:
 *         description: Unauthorized
 */
export const getAllClubRequests = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const requests = await db.select().from(clubRequests).all();

        return res.status(200).json(requests);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @swagger
 * /api/club-requests/{id}:
 *   get:
 *     summary: Get a specific club request
 *     tags: [Club Requests 🪩]
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
 *         description: Club request details
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Request not found
 */
export const getClubRequestById = async (req, res) => {
    try {
        const requestId = req.params.id;

        const request = await db.select().from(clubRequests).where(eq(clubRequests.id, requestId)).get();

        if (!request) {
            return res.status(404).json({ message: 'Club request not found' });
        }

        if (req.user.role !== 'super_admin' && req.user.id !== request.headId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        return res.status(200).json(request);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @swagger
 * /api/club-requests/{id}/approve:
 *   put:
 *     summary: Approve a club request (admin only)
 *     tags: [Club Requests 🪩]
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
 *         description: Club request approved
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Request not found
 */
export const approveClubRequest = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const requestId = req.params.id;

        const request = await db.select().from(clubRequests).where(eq(clubRequests.id, requestId)).get();

        if (!request) {
            return res.status(404).json({ message: 'Club request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: `Request already ${request.status}` });
        }

        await db.update(clubRequests)
            .set({
                status: 'approved',
                updatedAt: new Date()
            })
            .where(eq(clubRequests.id, requestId))
            .run();

        await db.insert(clubs).values({
            name: request.clubName,
            headId: request.headId,
            goal: request.goal,
            description: request.description,
            financing: request.financing,
            resources: request.resources,
            attractionMethods: request.attractionMethods,
        }).run();

        await db.update(users)
            .set({
                role: 'head_admin',
                updatedAt: new Date()
            })
            .where(eq(users.id, request.headId))
            .run();

        return res.status(200).json({ message: 'Club request approved and club created successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @swagger
 * /api/club-requests/{id}/reject:
 *   put:
 *     summary: Reject a club request (admin only)
 *     tags: [Club Requests 🪩]
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
 *         description: Club request rejected
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Request not found
 */
export const rejectClubRequest = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const requestId = req.params.id;

        const request = await db.select().from(clubRequests).where(eq(clubRequests.id, requestId)).get();

        if (!request) {
            return res.status(404).json({ message: 'Club request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: `Request already ${request.status}` });
        }

        await db.update(clubRequests)
            .set({
                status: 'rejected',
                updatedAt: new Date()
            })
            .where(eq(clubRequests.id, requestId))
            .run();

        return res.status(200).json({ message: 'Club request rejected' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @swagger
 * /api/club-requests/my-requests:
 *   get:
 *     summary: Get all club requests created by the current user
 *     tags: [Club Requests 🪩]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's club requests
 */
export const getUserClubRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const requests = await db.select()
            .from(clubRequests)
            .where(eq(clubRequests.headId, userId))
            .all();

        return res.status(200).json(requests);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};