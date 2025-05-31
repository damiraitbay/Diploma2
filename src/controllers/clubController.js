import { eq } from 'drizzle-orm';
import db from '../db.js';
import { clubs, eventRequests, events, posters, postLikes, posts, ticketBookings, users } from '../models/schema.js';

/**
 * @swagger
 * /api/clubs:
 *   get:
 *     summary: Get all approved clubs
 *     tags: [Clubs 💃]
 *     responses:
 *       200:
 *         description: List of clubs
 */
export const getAllClubs = async (req, res) => {
    try {
        const allClubs = await db.select({
            id: clubs.id,
            name: clubs.name,
            goal: clubs.goal,
            description: clubs.description,
            rating: clubs.rating,
            createdAt: clubs.createdAt,
            head: {
                id: users.id,
                name: users.name,
                surname: users.surname,
            }
        })
            .from(clubs)
            .leftJoin(users, eq(clubs.headId, users.id))
            .all();

        return res.status(200).json(allClubs);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/clubs/{id}:
 *   get:
 *     summary: Get a specific club
 *     tags: [Clubs 💃]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Club details
 *       404:
 *         description: Club not found
 */
export const getClubById = async (req, res) => {
    try {
        const clubId = req.params.id;

        const club = await db.select({
            id: clubs.id,
            name: clubs.name,
            goal: clubs.goal,
            description: clubs.description,
            financing: clubs.financing,
            resources: clubs.resources,
            attractionMethods: clubs.attractionMethods,
            rating: clubs.rating,
            createdAt: clubs.createdAt,
            head: {
                id: users.id,
                name: users.name,
                surname: users.surname,
                email: users.email,
            }
        })
            .from(clubs)
            .leftJoin(users, eq(clubs.headId, users.id))
            .where(eq(clubs.id, clubId))
            .get();

        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        return res.status(200).json(club);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/clubs/my-club:
 *   get:
 *     summary: Get the current user's club (head admin only)
 *     tags: [Clubs 💃]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's club details
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Club not found
 */
export const getUserClub = async (req, res) => {
    try {
        const userId = req.user.id;

        if (req.user.role !== 'head_admin') {
            return res.status(403).json({ message: 'Only head admins can access their club' });
        }

        const club = await db.select()
            .from(clubs)
            .where(eq(clubs.headId, userId))
            .get();

        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        return res.status(200).json(club);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/clubs/{id}:
 *   put:
 *     summary: Update a club (head admin only)
 *     tags: [Clubs 💃]
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
 *               goal:
 *                 type: string
 *               description:
 *                 type: string
 *               financing:
 *                 type: string
 *               resources:
 *                 type: string
 *               attractionMethods:
 *                 type: string
 *     responses:
 *       200:
 *         description: Club updated successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Club not found
 */
export const updateClub = async (req, res) => {
    try {
        const clubId = req.params.id;
        const userId = req.user.id;

        const club = await db.select().from(clubs).where(eq(clubs.id, clubId)).get();

        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        if (req.user.role !== 'head_admin' || club.headId !== userId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const { goal, description, financing, resources, attractionMethods } = req.body;

        await db.update(clubs)
            .set({
                goal: goal || club.goal,
                description: description || club.description,
                financing: financing || club.financing,
                resources: resources || club.resources,
                attractionMethods: attractionMethods || club.attractionMethods,
                updatedAt: new Date()
            })
            .where(eq(clubs.id, clubId))
            .run();

        return res.status(200).json({ message: 'Club updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/clubs/{id}:
 *   delete:
 *     summary: Delete a club (admin only)
 *     tags: [Clubs 💃]
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
 *         description: Club deleted successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Club not found
 */
export const deleteClub = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Only super admins can delete clubs' });
        }

        const clubId = req.params.id;

        const club = await db.select().from(clubs).where(eq(clubs.id, clubId)).get();

        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        const clubPosters = await db.select().from(posters).where(eq(posters.clubId, clubId)).all();
        for (const poster of clubPosters) {
            await db.delete(ticketBookings).where(eq(ticketBookings.posterId, poster.id)).run();
        }

        const clubPosts = await db.select().from(posts).where(eq(posts.clubId, clubId)).all();
        for (const post of clubPosts) {
            await db.delete(postLikes).where(eq(postLikes.postId, post.id)).run();
        }

        await db.delete(posts).where(eq(posts.clubId, clubId)).run();
        await db.delete(posters).where(eq(posters.clubId, clubId)).run();
        await db.delete(events).where(eq(events.clubId, clubId)).run();
        await db.delete(eventRequests).where(eq(eventRequests.clubId, clubId)).run();

        await db.update(users)
            .set({
                role: 'student',
                updatedAt: new Date()
            })
            .where(eq(users.id, club.headId))
            .run();

        await db.delete(clubs).where(eq(clubs.id, clubId)).run();
        return res.status(200).json({
            message: 'Club deleted successfully and head admin role reset to student'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}