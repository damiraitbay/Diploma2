import { db } from '../db.js';
import { events, eventComments } from '../models/schema.js';
import { eq, desc } from 'drizzle-orm';
import { sendEventReminderNotification } from './notificationService.js';

// Add comment to event
const addEventComment = async(userId, eventId, content) => {
    try {
        const comment = await db.insert(eventComments)
            .values({
                userId,
                eventId,
                content
            })
            .returning();

        return comment[0];
    } catch (error) {
        console.error('Error adding event comment:', error);
        throw error;
    }
};

// Get event comments
const getEventComments = async(eventId) => {
    try {
        const comments = await db.select()
            .from(eventComments)
            .where(eq(eventComments.eventId, eventId))
            .orderBy(desc(eventComments.createdAt));

        return comments;
    } catch (error) {
        console.error('Error getting event comments:', error);
        throw error;
    }
};

// Update event comment
const updateEventComment = async(commentId, userId, content) => {
    try {
        const comment = await db.update(eventComments)
            .set({
                content,
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(eventComments.id, commentId),
                    eq(eventComments.userId, userId)
                )
            )
            .returning();

        return comment[0];
    } catch (error) {
        console.error('Error updating event comment:', error);
        throw error;
    }
};

// Delete event comment
const deleteEventComment = async(commentId, userId) => {
    try {
        const result = await db.delete(eventComments)
            .where(
                and(
                    eq(eventComments.id, commentId),
                    eq(eventComments.userId, userId)
                )
            )
            .returning();

        return result[0];
    } catch (error) {
        console.error('Error deleting event comment:', error);
        throw error;
    }
};

// Send event reminders
const sendEventReminders = async() => {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        // Get events happening tomorrow
        const upcomingEvents = await db.select()
            .from(events)
            .where(eq(events.eventDate, tomorrowStr));

        // Send reminders for each event
        for (const event of upcomingEvents) {
            // Get all users who have tickets for this event
            const ticketHolders = await db.select()
                .from(ticketBookings)
                .where(
                    and(
                        eq(ticketBookings.eventId, event.id),
                        eq(ticketBookings.status, 'approved')
                    )
                );

            // Send reminder to each ticket holder
            for (const ticket of ticketHolders) {
                await sendEventReminderNotification(
                    ticket.userId,
                    event.eventName,
                    event.eventDate,
                    event.location
                );
            }
        }
    } catch (error) {
        console.error('Error sending event reminders:', error);
        throw error;
    }
};

export {
    addEventComment,
    getEventComments,
    updateEventComment,
    deleteEventComment,
    sendEventReminders
};