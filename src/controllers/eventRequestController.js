import { eq } from 'drizzle-orm';
import db from '../db.js';
import { eventRequests, events, clubs, users } from '../models/schema.js';
import { getFileUrl, deleteFile } from '../utils/fileUploadService.js';

/**
 * @swagger
 * /api/event-requests:
 *   post:
 *     summary: Submit a new event request (head admin only)
 *     tags: [Event Requests 🎀]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - eventName
 *               - eventDate
 *               - location
 *               - shortDescription
 *               - goal
 *               - organizers
 *               - schedule
 *               - clubHead
 *               - phone
 *             properties:
 *               eventName:
 *                 type: string
 *               eventDate:
 *                 type: string
 *               location:
 *                 type: string
 *               shortDescription:
 *                 type: string
 *               goal:
 *                 type: string
 *               organizers:
 *                 type: string
 *               schedule:
 *                 type: string
 *               sponsorship:
 *                 type: string
 *               clubHead:
 *                 type: string
 *               phone:
 *                 type: string
 *               comment:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Event request submitted successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Unauthorized
 */
export const createEventRequest = async(req, res) => {
    try {
        if (req.user.role !== 'head_admin') {
            return res.status(403).json({ message: 'Only head admins can create event requests' });
        }

        const userId = req.user.id;
        const image = req.file ? getFileUrl(req.file.filename) : null;

        const club = await db.select().from(clubs).where(eq(clubs.headId, userId)).get();

        if (!club) {
            if (req.file) {
                deleteFile(req.file.filename);
            }
            return res.status(404).json({ message: 'You do not have a club' });
        }

        const {
            eventName,
            eventDate,
            location,
            shortDescription,
            goal,
            organizers,
            schedule,
            sponsorship,
            clubHead,
            phone,
            comment
        } = req.body;

        await db.insert(eventRequests).values({
            clubId: club.id,
            headId: userId,
            eventName,
            eventDate,
            location,
            shortDescription,
            goal,
            organizers,
            schedule,
            sponsorship,
            clubHead,
            phone,
            comment,
            image,
            status: 'pending'
        }).run();

        return res.status(201).json({ message: 'Event request submitted successfully' });
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
 * /api/event-requests:
 *   get:
 *     summary: Get all event requests (admin only)
 *     tags: [Event Requests 🎀]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of event requests
 *       403:
 *         description: Unauthorized
 */
export const getAllEventRequests = async(req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const requests = await db.select({
                id: eventRequests.id,
                eventName: eventRequests.eventName,
                eventDate: eventRequests.eventDate,
                location: eventRequests.location,
                status: eventRequests.status,
                createdAt: eventRequests.createdAt,
                club: {
                    id: clubs.id,
                    name: clubs.name,
                },
                head: {
                    id: users.id,
                    name: users.name,
                    surname: users.surname,
                }
            })
            .from(eventRequests)
            .leftJoin(clubs, eq(eventRequests.clubId, clubs.id))
            .leftJoin(users, eq(eventRequests.headId, users.id))
            .all();

        return res.status(200).json(requests);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/event-requests/{id}:
 *   get:
 *     summary: Get a specific event request
 *     tags: [Event Requests 🎀]
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
 *         description: Event request details
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Request not found
 */
export const getEventRequestById = async(req, res) => {
    try {
        const requestId = req.params.id;

        const request = await db.select().from(eventRequests).where(eq(eventRequests.id, requestId)).get();

        if (!request) {
            return res.status(404).json({ message: 'Event request not found' });
        }

        if (req.user.role !== 'super_admin' && req.user.id !== request.headId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        return res.status(200).json(request);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/event-requests/{id}/approve:
 *   put:
 *     summary: Approve an event request (admin only)
 *     tags: [Event Requests 🎀]
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
 *         description: Event request approved
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Request not found
 */
export const approveEventRequest = async(req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const requestId = req.params.id;

        const request = await db.select().from(eventRequests).where(eq(eventRequests.id, requestId)).get();

        if (!request) {
            return res.status(404).json({ message: 'Event request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: `Request already ${request.status}` });
        }

        await db.update(eventRequests)
            .set({
                status: 'approved',
                updatedAt: new Date()
            })
            .where(eq(eventRequests.id, requestId))
            .run();

        await db.insert(events).values({
            clubId: request.clubId,
            headId: request.headId,
            eventName: request.eventName,
            eventDate: request.eventDate,
            location: request.location,
            shortDescription: request.shortDescription,
            goal: request.goal,
            organizers: request.organizers,
            schedule: request.schedule,
            sponsorship: request.sponsorship,
        }).run();

        return res.status(200).json({ message: 'Event request approved and event created successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/event-requests/{id}/reject:
 *   put:
 *     summary: Reject an event request (admin only)
 *     tags: [Event Requests 🎀]
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
 *         description: Event request rejected
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Request not found
 */
export const rejectEventRequest = async(req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const requestId = req.params.id;

        const request = await db.select().from(eventRequests).where(eq(eventRequests.id, requestId)).get();

        if (!request) {
            return res.status(404).json({ message: 'Event request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: `Request already ${request.status}` });
        }

        await db.update(eventRequests)
            .set({
                status: 'rejected',
                updatedAt: new Date()
            })
            .where(eq(eventRequests.id, requestId))
            .run();

        return res.status(200).json({ message: 'Event request rejected' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/event-requests/my-requests:
 *   get:
 *     summary: Get all event requests created by the current user (head admin only)
 *     tags: [Event Requests 🎀]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's event requests
 *       403:
 *         description: Unauthorized
 */
export const getUserEventRequests = async(req, res) => {
    try {
        if (req.user.role !== 'head_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const userId = req.user.id;

        const requests = await db.select()
            .from(eventRequests)
            .where(eq(eventRequests.headId, userId))
            .all();

        return res.status(200).json(requests);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}