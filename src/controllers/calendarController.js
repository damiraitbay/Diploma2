import { eq, and } from 'drizzle-orm';
import db from '../db.js';
import { ticketBookings, posters, personalEvents } from '../models/schema.js';

/**
 * @swagger
 * /api/calendar:
 *   get:
 *     summary: Get combined calendar with tickets and personal events
 *     tags: [Calendar 📅]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Combined calendar events
 */
export const getCombinedCalendar = async (req, res) => {
    try {
        const userId = req.user.id;

        const approvedTickets = await db.select({
            id: ticketBookings.id,
            numberOfPersons: ticketBookings.numberOfPersons,
            poster: {
                id: posters.id,
                eventTitle: posters.eventTitle,
                eventDate: posters.eventDate,
                time: posters.time,
                location: posters.location,
            }
        })
            .from(ticketBookings)
            .leftJoin(posters, eq(ticketBookings.posterId, posters.id))
            .where(
                and(
                    eq(ticketBookings.userId, userId),
                    eq(ticketBookings.status, 'approved')
                )
            )
            .all();

        const userPersonalEvents = await db.select()
            .from(personalEvents)
            .where(eq(personalEvents.userId, userId))
            .all();

        const ticketEvents = approvedTickets.map(ticket => ({
            id: `ticket-${ticket.id}`,
            title: ticket.poster.eventTitle,
            date: ticket.poster.eventDate,
            time: ticket.poster.time,
            location: ticket.poster.location,
            type: 'ticket',
            persons: ticket.numberOfPersons,
            source: 'booking'
        }));

        const personalEventsList = userPersonalEvents.map(event => ({
            id: `personal-${event.id}`,
            title: event.eventName,
            date: event.date,
            startTime: event.startTime,
            endTime: event.endTime,
            suggestions: event.suggestions,
            remindMe: event.remindMe,
            type: 'personal',
            source: 'personal'
        }));

        const allEvents = [...ticketEvents, ...personalEventsList];

        return res.status(200).json({
            totalEvents: allEvents.length,
            ticketEvents: ticketEvents.length,
            personalEvents: personalEventsList.length,
            events: allEvents
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}


/**
 * @swagger
 * /api/events/my-club-calendar:
 *   get:
 *     summary: Get calendar events for head admin's club
 *     tags: [Calendar 📅]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of calendar events for the club
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Club not found
 */
export const getHeadAdminCalendar = async (req, res) => {
    try {
        if (req.user.role !== 'head_admin') {
            return res.status(403).json({ message: 'Only head admins can access club calendar' });
        }

        const headId = req.user.id;

        const club = await db.select().from(clubs).where(eq(clubs.headId, headId)).get();

        if (!club) {
            return res.status(404).json({ message: 'You do not have a club' });
        }

        const clubEvents = await db.select({
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
        })
            .from(events)
            .where(eq(events.clubId, club.id))
            .all();

        const calendarEvents = clubEvents.map(event => ({
            id: event.id,
            title: event.eventName,
            date: event.eventDate,
            location: event.location,
            description: event.shortDescription,
            schedule: event.schedule,
            type: 'club_event',
            clubId: club.id,
            clubName: club.name
        }));

        return res.status(200).json({
            club: {
                id: club.id,
                name: club.name
            },
            events: calendarEvents
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/calendar/events:
 *   get:
 *     summary: Get all approved events for the user's calendar
 *     tags: [Calendar 📅]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of calendar events
 */
export const getUserCalendar = async (req, res) => {
    try {
        const userId = req.user.id;

        const approvedTickets = await db.select({
            id: ticketBookings.id,
            numberOfPersons: ticketBookings.numberOfPersons,
            poster: {
                id: posters.id,
                eventTitle: posters.eventTitle,
                eventDate: posters.eventDate,
                time: posters.time,
                location: posters.location,
            }
        })
            .from(ticketBookings)
            .leftJoin(posters, eq(ticketBookings.posterId, posters.id))
            .where(
                and(
                    eq(ticketBookings.userId, userId),
                    eq(ticketBookings.status, 'approved')
                )
            )
            .all();

        const calendarEvents = approvedTickets.map(ticket => ({
            id: ticket.id,
            title: ticket.poster.eventTitle,
            date: ticket.poster.eventDate,
            time: ticket.poster.time,
            location: ticket.poster.location,
            type: 'ticket',
            persons: ticket.numberOfPersons
        }));

        return res.status(200).json(calendarEvents);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}