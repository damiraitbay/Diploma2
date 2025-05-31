import { db } from '../db.js';
import { userNotifications } from '../models/schema.js';
import { sendEmail, emailTemplates } from './emailService.js';

// Create a notification
const createNotification = async(userId, type, title, message, relatedId = null) => {
    try {
        const notification = await db.insert(userNotifications).values({
            userId,
            type,
            title,
            message,
            relatedId,
            isRead: false
        }).returning();

        return notification[0];
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Get user's notifications
const getUserNotifications = async(userId) => {
    try {
        const notifications = await db.select()
            .from(userNotifications)
            .where(eq(userNotifications.userId, userId))
            .orderBy(desc(userNotifications.createdAt));

        return notifications;
    } catch (error) {
        console.error('Error getting notifications:', error);
        throw error;
    }
};

// Mark notification as read
const markNotificationAsRead = async(notificationId) => {
    try {
        const notification = await db.update(userNotifications)
            .set({ isRead: true })
            .where(eq(userNotifications.id, notificationId))
            .returning();

        return notification[0];
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

// Send notification and email for club approval
const sendClubApprovalNotification = async(userId, clubName) => {
    try {
        // Create in-app notification
        await createNotification(
            userId,
            'club_approved',
            'Club Request Approved',
            `Your club "${clubName}" has been approved!`,
            clubId
        );

        // Send email notification
        const { subject, html } = emailTemplates.clubApproval(clubName);
        await sendEmail(userEmail, subject, null, html);
    } catch (error) {
        console.error('Error sending club approval notification:', error);
        throw error;
    }
};

// Send notification and email for event approval
const sendEventApprovalNotification = async(userId, eventName) => {
    try {
        // Create in-app notification
        await createNotification(
            userId,
            'event_approved',
            'Event Request Approved',
            `Your event "${eventName}" has been approved!`,
            eventId
        );

        // Send email notification
        const { subject, html } = emailTemplates.eventApproval(eventName);
        await sendEmail(userEmail, subject, null, html);
    } catch (error) {
        console.error('Error sending event approval notification:', error);
        throw error;
    }
};

// Send notification and email for ticket approval
const sendTicketApprovalNotification = async(userId, eventName, ticketId) => {
    try {
        // Create in-app notification
        await createNotification(
            userId,
            'ticket_approved',
            'Ticket Approved',
            `Your ticket for "${eventName}" has been approved!`,
            ticketId
        );

        // Send email notification
        const { subject, html } = emailTemplates.ticketConfirmation(eventName, ticketId);
        await sendEmail(userEmail, subject, null, html);
    } catch (error) {
        console.error('Error sending ticket approval notification:', error);
        throw error;
    }
};

// Send event reminder notification
const sendEventReminderNotification = async(userId, eventName, date, location) => {
    try {
        // Create in-app notification
        await createNotification(
            userId,
            'event_reminder',
            'Event Reminder',
            `Don't forget about "${eventName}" tomorrow!`,
            eventId
        );

        // Send email notification
        const { subject, html } = emailTemplates.eventReminder(eventName, date, location);
        await sendEmail(userEmail, subject, null, html);
    } catch (error) {
        console.error('Error sending event reminder notification:', error);
        throw error;
    }
};

export {
    createNotification,
    getUserNotifications,
    markNotificationAsRead,
    sendClubApprovalNotification,
    sendEventApprovalNotification,
    sendTicketApprovalNotification,
    sendEventReminderNotification
};