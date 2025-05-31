import { eq } from 'drizzle-orm';
import db from '../db.js';
import { personalEvents } from '../models/schema.js';

/**
 * @swagger
 * /api/personal-events:
 *   post:
 *     summary: Create a new personal event
 *     tags: [Personal Events 🎃]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventName
 *               - date
 *               - startTime
 *               - endTime
 *             properties:
 *               eventName:
 *                 type: string
 *               suggestions:
 *                 type: string
 *               date:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               remindMe:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Personal event created successfully
 *       400:
 *         description: Invalid input
 */
export const createPersonalEvent = async (req, res) => {
    try {
        const { eventName, suggestions, date, startTime, endTime, remindMe } = req.body;
        const userId = req.user.id;

        await db.insert(personalEvents).values({
            userId,
            eventName,
            suggestions,
            date,
            startTime,
            endTime,
            remindMe: remindMe || false
        }).run();

        return res.status(201).json({ message: 'Personal event created successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/personal-events:
 *   get:
 *     summary: Get all personal events for the current user
 *     tags: [Personal Events 🎃]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's personal events
 */
export const getUserPersonalEvents = async (req, res) => {
    try {
        const userId = req.user.id;

        const userPersonalEvents = await db.select()
            .from(personalEvents)
            .where(eq(personalEvents.userId, userId))
            .all();

        return res.status(200).json(userPersonalEvents);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/personal-events/{id}:
 *   get:
 *     summary: Get a specific personal event
 *     tags: [Personal Events 🎃]
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
 *         description: Personal event details
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Personal event not found
 */
export const getPersonalEventById = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;

        const personalEvent = await db.select()
            .from(personalEvents)
            .where(eq(personalEvents.id, eventId))
            .get();

        if (!personalEvent) {
            return res.status(404).json({ message: 'Personal event not found' });
        }

        if (personalEvent.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        return res.status(200).json(personalEvent);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/personal-events/{id}:
 *   put:
 *     summary: Update a personal event
 *     tags: [Personal Events 🎃]
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
 *             properties:
 *               eventName:
 *                 type: string
 *               suggestions:
 *                 type: string
 *               date:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               remindMe:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Personal event updated successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Personal event not found
 */
export const updatePersonalEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;

        const personalEvent = await db.select()
            .from(personalEvents)
            .where(eq(personalEvents.id, eventId))
            .get();

        if (!personalEvent) {
            return res.status(404).json({ message: 'Personal event not found' });
        }

        if (personalEvent.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const { eventName, suggestions, date, startTime, endTime, remindMe } = req.body;

        await db.update(personalEvents)
            .set({
                eventName: eventName || personalEvent.eventName,
                suggestions: suggestions !== undefined ? suggestions : personalEvent.suggestions,
                date: date || personalEvent.date,
                startTime: startTime || personalEvent.startTime,
                endTime: endTime || personalEvent.endTime,
                remindMe: remindMe !== undefined ? remindMe : personalEvent.remindMe,
                updatedAt: new Date()
            })
            .where(eq(personalEvents.id, eventId))
            .run();

        return res.status(200).json({ message: 'Personal event updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/personal-events/{id}:
 *   delete:
 *     summary: Delete a personal event
 *     tags: [Personal Events 🎃]
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
 *         description: Personal event deleted successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Personal event not found
 */
export const deletePersonalEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;

        const personalEvent = await db.select()
            .from(personalEvents)
            .where(eq(personalEvents.id, eventId))
            .get();

        if (!personalEvent) {
            return res.status(404).json({ message: 'Personal event not found' });
        }

        if (personalEvent.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        await db.delete(personalEvents)
            .where(eq(personalEvents.id, eventId))
            .run();

        return res.status(200).json({ message: 'Personal event deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}