import { eq } from 'drizzle-orm';
import db from '../db.js';
import { events, clubs, users } from '../models/schema.js';

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all approved events
 *     tags: [Events 🎆]
 *     responses:
 *       200:
 *         description: List of events
 */
export const getAllEvents = async (req, res) => {
    try {
        const allEvents = await db.select({
            id: events.id,
            eventName: events.eventName,
            eventDate: events.eventDate,
            location: events.location,
            shortDescription: events.shortDescription,
            createdAt: events.createdAt,
            club: {
                id: clubs.id,
                name: clubs.name,
            }
        })
            .from(events)
            .leftJoin(clubs, eq(events.clubId, clubs.id))
            .all();

        return res.status(200).json(allEvents);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get a specific event
 *     tags: [Events 🎆]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
export const getEventById = async (req, res) => {
    try {
        const eventId = req.params.id;

        const event = await db.select({
            id: events.id,
            eventName: events.eventName,
            eventDate: events.eventDate,
            location: events.location,
            shortDescription: events.shortDescription,
            goal: events.goal,
            organizers: events.organizers,
            schedule: events.schedule,
            sponsorship: events.sponsorship,
            createdAt: events.createdAt,
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
            .from(events)
            .leftJoin(clubs, eq(events.clubId, clubs.id))
            .leftJoin(users, eq(events.headId, users.id))
            .where(eq(events.id, eventId))
            .get();

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        return res.status(200).json(event);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/events/club/{clubId}:
 *   get:
 *     summary: Get all events for a specific club
 *     tags: [Events 🎆]
 *     parameters:
 *       - in: path
 *         name: clubId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of club events
 */
export const getEventsByClubId = async (req, res) => {
    try {
        const clubId = req.params.clubId;

        const clubEvents = await db.select({
            id: events.id,
            eventName: events.eventName,
            eventDate: events.eventDate,
            location: events.location,
            shortDescription: events.shortDescription,
            createdAt: events.createdAt,
        })
            .from(events)
            .where(eq(events.clubId, clubId))
            .all();

        return res.status(200).json(clubEvents);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/events/my-events:
 *   get:
 *     summary: Get all events for the current user's club (head admin only)
 *     tags: [Events 🎆]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's club events
 *       403:
 *         description: Unauthorized
 */
export const getUserClubEvents = async (req, res) => {
    try {
        if (req.user.role !== 'head_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const userId = req.user.id;

        const club = await db.select().from(clubs).where(eq(clubs.headId, userId)).get();

        if (!club) {
            return res.status(404).json({ message: 'You do not have a club' });
        }

        const clubEvents = await db.select()
            .from(events)
            .where(eq(events.clubId, club.id))
            .all();

        return res.status(200).json(clubEvents);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}