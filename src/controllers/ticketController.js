import { eq, and } from 'drizzle-orm';
import db from '../db.js';
import { ticketBookings, posters, users } from '../models/schema.js';
import { getFileUrl, deleteFile } from '../utils/fileUploadService.js';

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Book a ticket for an event
 *     tags: [Tickets 🎫]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - posterId
 *               - numberOfPersons
 *               - paymentProof
 *             properties:
 *               posterId:
 *                 type: integer
 *               numberOfPersons:
 *                 type: integer
 *               paymentProof:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Ticket booked successfully
 *       400:
 *         description: Invalid input or not enough seats available
 *       404:
 *         description: Poster not found
 */
export const bookTicket = async(req, res) => {
    try {
        const { posterId, numberOfPersons, paymentProof } = req.body;
        const userId = req.user.id;

        if (!paymentProof) {
            return res.status(400).json({ message: 'Payment proof is required' });
        }

        const poster = await db.select().from(posters).where(eq(posters.id, posterId)).get();

        if (!poster) {
            return res.status(404).json({ message: 'Poster not found' });
        }

        if (poster.seatsLeft < numberOfPersons) {
            return res.status(400).json({ message: 'Not enough seats available' });
        }

        await db.insert(ticketBookings).values({
            posterId,
            userId,
            numberOfPersons,
            paymentProof,
            status: 'pending'
        }).run();

        await db.update(posters)
            .set({
                seatsLeft: poster.seatsLeft - numberOfPersons,
                updatedAt: new Date()
            })
            .where(eq(posters.id, posterId))
            .run();

        return res.status(201).json({ message: 'Ticket booked successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: Get all ticket bookings for the current user
 *     tags: [Tickets 🎫]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's ticket bookings
 */
export const getUserTickets = async(req, res) => {
    try {
        const userId = req.user.id;

        const tickets = await db.select({
                id: ticketBookings.id,
                numberOfPersons: ticketBookings.numberOfPersons,
                status: ticketBookings.status,
                createdAt: ticketBookings.createdAt,
                poster: {
                    id: posters.id,
                    eventTitle: posters.eventTitle,
                    eventDate: posters.eventDate,
                    location: posters.location,
                    time: posters.time,
                    price: posters.price,
                }
            })
            .from(ticketBookings)
            .leftJoin(posters, eq(ticketBookings.posterId, posters.id))
            .where(eq(ticketBookings.userId, userId))
            .all();

        return res.status(200).json(tickets);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/tickets/pending:
 *   get:
 *     summary: Get all pending ticket bookings for the head admin's events
 *     tags: [Tickets 🎫]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending ticket bookings
 *       403:
 *         description: Unauthorized
 */
export const getPendingTickets = async(req, res) => {
    try {
        if (req.user.role !== 'head_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const headId = req.user.id;

        const pendingTickets = await db.select({
                id: ticketBookings.id,
                numberOfPersons: ticketBookings.numberOfPersons,
                paymentProof: ticketBookings.paymentProof,
                createdAt: ticketBookings.createdAt,
                poster: {
                    id: posters.id,
                    eventTitle: posters.eventTitle,
                    eventDate: posters.eventDate,
                },
                user: {
                    id: users.id,
                    name: users.name,
                    surname: users.surname,
                    email: users.email,
                }
            })
            .from(ticketBookings)
            .leftJoin(posters, eq(ticketBookings.posterId, posters.id))
            .leftJoin(users, eq(ticketBookings.userId, users.id))
            .where(
                and(
                    eq(posters.headId, headId),
                    eq(ticketBookings.status, 'pending')
                )
            )
            .all();

        return res.status(200).json(pendingTickets);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/tickets/{id}/approve:
 *   put:
 *     summary: Approve a ticket booking (head admin only)
 *     tags: [Tickets 🎫]
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
 *         description: Ticket booking approved
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Ticket booking not found
 */
export const approveTicket = async(req, res) => {
    try {
        if (req.user.role !== 'head_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const ticketId = req.params.id;
        const headId = req.user.id;

        const ticketBooking = await db.select()
            .from(ticketBookings)
            .where(eq(ticketBookings.id, ticketId))
            .get();

        if (!ticketBooking) {
            return res.status(404).json({ message: 'Ticket booking not found' });
        }

        const poster = await db.select()
            .from(posters)
            .where(eq(posters.id, ticketBooking.posterId))
            .get();

        if (!poster) {
            return res.status(404).json({ message: 'Associated poster not found' });
        }

        if (poster.headId !== headId) {
            return res.status(403).json({ message: 'You can only approve tickets for your own events' });
        }

        if (ticketBooking.status !== 'pending') {
            return res.status(400).json({ message: `Ticket already ${ticketBooking.status}` });
        }

        await db.update(ticketBookings)
            .set({
                status: 'approved',
                updatedAt: new Date()
            })
            .where(eq(ticketBookings.id, ticketId))
            .run();

        return res.status(200).json({ message: 'Ticket booking approved' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @swagger
 * /api/tickets/{id}/reject:
 *   put:
 *     summary: Reject a ticket booking (head admin only)
 *     tags: [Tickets 🎫]
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
 *         description: Ticket booking rejected
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Ticket booking not found
 */
export const rejectTicket = async(req, res) => {
    try {
        if (req.user.role !== 'head_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const ticketId = req.params.id;
        const headId = req.user.id;

        const ticketBooking = await db.select()
            .from(ticketBookings)
            .where(eq(ticketBookings.id, ticketId))
            .get();

        if (!ticketBooking) {
            return res.status(404).json({ message: 'Ticket booking not found' });
        }

        const poster = await db.select()
            .from(posters)
            .where(eq(posters.id, ticketBooking.posterId))
            .get();

        if (!poster) {
            return res.status(404).json({ message: 'Associated poster not found' });
        }

        if (poster.headId !== headId) {
            return res.status(403).json({ message: 'You can only reject tickets for your own events' });
        }

        if (ticketBooking.status !== 'pending') {
            return res.status(400).json({ message: `Ticket already ${ticketBooking.status}` });
        }

        await db.update(posters)
            .set({
                seatsLeft: poster.seatsLeft + ticketBooking.numberOfPersons,
                updatedAt: new Date()
            })
            .where(eq(posters.id, ticketBooking.posterId))
            .run();

        // Update ticket status
        await db.update(ticketBookings)
            .set({
                status: 'rejected',
                updatedAt: new Date()
            })
            .where(eq(ticketBookings.id, ticketId))
            .run();

        return res.status(200).json({ message: 'Ticket booking rejected and seats restored' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}