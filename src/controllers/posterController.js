import { eq } from 'drizzle-orm';
import db from '../db.js';
import { posters, events, clubs, users } from '../models/schema.js';

/**
 * @swagger
 * /api/posters:
 *   post:
 *     summary: Create a new poster (head admin only)
 *     tags: [Posters 🪧]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - eventTitle
 *               - eventDate
 *               - location
 *               - time
 *               - description
 *               - seats
 *               - price
 *             properties:
 *               eventId:
 *                 type: integer
 *               eventTitle:
 *                 type: string
 *               eventDate:
 *                 type: string
 *               location:
 *                 type: string
 *               time:
 *                 type: string
 *               description:
 *                 type: string
 *               seats:
 *                 type: integer
 *               price:
 *                 type: integer
 *               image:
 *                 type: string
 *     responses:
 *       201:
 *         description: Poster created successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Unauthorized
 */
export const createPoster = async (req, res) => {
    try {
        if (req.user.role !== 'head_admin') {
            return res.status(403).json({ message: 'Only head admins can create posters' });
        }

        const userId = req.user.id;

        const {
            eventId,
            eventTitle,
            eventDate,
            location,
            time,
            description,
            seats,
            price,
            image
        } = req.body;

        const event = await db.select().from(events).where(eq(events.id, eventId)).get();

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.headId !== userId) {
            return res.status(403).json({ message: 'You can only create posters for your own events' });
        }

        await db.insert(posters).values({
            eventId,
            clubId: event.clubId,
            headId: userId,
            eventTitle,
            eventDate,
            location,
            time,
            description,
            seats,
            seatsLeft: seats,
            price,
            image
        }).run();

        return res.status(201).json({ message: 'Poster created successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @swagger
 * /api/posters:
 *   get:
 *     summary: Get all posters
 *     tags: [Posters 🪧]
 *     responses:
 *       200:
 *         description: List of posters
 */
export const getAllPosters = async (req, res) => {
    try {
        const allPosters = await db.select({
            id: posters.id,
            eventTitle: posters.eventTitle,
            eventDate: posters.eventDate,
            location: posters.location,
            time: posters.time,
            description: posters.description,
            seats: posters.seats,
            seatsLeft: posters.seatsLeft,
            price: posters.price,
            image: posters.image,
            club: {
                id: clubs.id,
                name: clubs.name,
            }
        })
            .from(posters)
            .leftJoin(clubs, eq(posters.clubId, clubs.id))
            .all();

        return res.status(200).json(allPosters);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/posters/{id}:
 *   get:
 *     summary: Get a specific poster
 *     tags: [Posters 🪧]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Poster details
 *       404:
 *         description: Poster not found
 */
export const getPosterById = async (req, res) => {
    try {
        const posterId = req.params.id;

        const poster = await db.select({
            id: posters.id,
            eventTitle: posters.eventTitle,
            eventDate: posters.eventDate,
            location: posters.location,
            time: posters.time,
            description: posters.description,
            seats: posters.seats,
            seatsLeft: posters.seatsLeft,
            price: posters.price,
            image: posters.image,
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
            .from(posters)
            .leftJoin(clubs, eq(posters.clubId, clubs.id))
            .leftJoin(users, eq(posters.headId, users.id))
            .where(eq(posters.id, posterId))
            .get();

        if (!poster) {
            return res.status(404).json({ message: 'Poster not found' });
        }

        return res.status(200).json(poster);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/posters/club/{clubId}:
 *   get:
 *     summary: Get all posters for a specific club
 *     tags: [Posters 🪧]
 *     parameters:
 *       - in: path
 *         name: clubId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of club posters
 */
export const getPostersByClubId = async (req, res) => {
    try {
        const clubId = req.params.clubId;

        const clubPosters = await db.select({
            id: posters.id,
            eventTitle: posters.eventTitle,
            eventDate: posters.eventDate,
            location: posters.location,
            time: posters.time,
            description: posters.description,
            seats: posters.seats,
            seatsLeft: posters.seatsLeft,
            price: posters.price,
            image: posters.image,
        })
            .from(posters)
            .where(eq(posters.clubId, clubId))
            .all();

        return res.status(200).json(clubPosters);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/posters/my-posters:
 *   get:
 *     summary: Get all posters created by the current user (head admin only)
 *     tags: [Posters 🪧]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's posters
 *       403:
 *         description: Unauthorized
 */
export const getUserPosters = async (req, res) => {
    try {
        if (req.user.role !== 'head_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const userId = req.user.id;

        const userPosters = await db.select()
            .from(posters)
            .where(eq(posters.headId, userId))
            .all();

        return res.status(200).json(userPosters);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/posters/{id}:
 *   put:
 *     summary: Update a poster (head admin only)
 *     tags: [Posters 🪧]
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
 *               eventTitle:
 *                 type: string
 *               eventDate:
 *                 type: string
 *               location:
 *                 type: string
 *               time:
 *                 type: string
 *               description:
 *                 type: string
 *               seats:
 *                 type: integer
 *               price:
 *                 type: integer
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Poster updated successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Poster not found
 */
export const updatePoster = async (req, res) => {
    try {
        const posterId = req.params.id;
        const userId = req.user.id;

        const poster = await db.select().from(posters).where(eq(posters.id, posterId)).get();

        if (!poster) {
            return res.status(404).json({ message: 'Poster not found' });
        }

        if (req.user.role !== 'head_admin' || poster.headId !== userId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const {
            eventTitle,
            eventDate,
            location,
            time,
            description,
            seats,
            price,
            image
        } = req.body;

        let seatsLeft = poster.seatsLeft;
        if (seats && seats !== poster.seats) {
            const seatsDifference = seats - poster.seats;
            seatsLeft = poster.seatsLeft + seatsDifference;
            if (seatsLeft < 0) seatsLeft = 0;
        }

        await db.update(posters)
            .set({
                eventTitle: eventTitle || poster.eventTitle,
                eventDate: eventDate || poster.eventDate,
                location: location || poster.location,
                time: time || poster.time,
                description: description || poster.description,
                seats: seats || poster.seats,
                seatsLeft: seatsLeft,
                price: price || poster.price,
                image: image !== undefined ? image : poster.image,
                updatedAt: new Date()
            })
            .where(eq(posters.id, posterId))
            .run();

        return res.status(200).json({ message: 'Poster updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}