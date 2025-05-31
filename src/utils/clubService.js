import { db } from '../db.js';
import { clubs, clubSubscriptions, clubRatings } from '../models/schema.js';
import { eq, and, avg, desc } from 'drizzle-orm';

// Subscribe to a club
const subscribeToClub = async(userId, clubId) => {
    try {
        // Check if already subscribed
        const existingSubscription = await db.select()
            .from(clubSubscriptions)
            .where(
                and(
                    eq(clubSubscriptions.userId, userId),
                    eq(clubSubscriptions.clubId, clubId)
                )
            );

        if (existingSubscription.length > 0) {
            throw new Error('Already subscribed to this club');
        }

        // Create subscription
        const subscription = await db.insert(clubSubscriptions)
            .values({
                userId,
                clubId
            })
            .returning();

        return subscription[0];
    } catch (error) {
        console.error('Error subscribing to club:', error);
        throw error;
    }
};

// Unsubscribe from a club
const unsubscribeFromClub = async(userId, clubId) => {
    try {
        const result = await db.delete(clubSubscriptions)
            .where(
                and(
                    eq(clubSubscriptions.userId, userId),
                    eq(clubSubscriptions.clubId, clubId)
                )
            )
            .returning();

        return result[0];
    } catch (error) {
        console.error('Error unsubscribing from club:', error);
        throw error;
    }
};

// Get user's subscribed clubs
const getUserSubscribedClubs = async(userId) => {
    try {
        const subscribedClubs = await db.select({
                club: clubs,
                subscriptionDate: clubSubscriptions.createdAt
            })
            .from(clubSubscriptions)
            .innerJoin(clubs, eq(clubSubscriptions.clubId, clubs.id))
            .where(eq(clubSubscriptions.userId, userId));

        return subscribedClubs;
    } catch (error) {
        console.error('Error getting subscribed clubs:', error);
        throw error;
    }
};

// Rate a club
const rateClub = async(userId, clubId, rating, comment = null) => {
    try {
        // Check if already rated
        const existingRating = await db.select()
            .from(clubRatings)
            .where(
                and(
                    eq(clubRatings.userId, userId),
                    eq(clubRatings.clubId, clubId)
                )
            );

        let result;
        if (existingRating.length > 0) {
            // Update existing rating
            result = await db.update(clubRatings)
                .set({
                    rating,
                    comment,
                    updatedAt: new Date()
                })
                .where(
                    and(
                        eq(clubRatings.userId, userId),
                        eq(clubRatings.clubId, clubId)
                    )
                )
                .returning();
        } else {
            // Create new rating
            result = await db.insert(clubRatings)
                .values({
                    userId,
                    clubId,
                    rating,
                    comment
                })
                .returning();
        }

        // Update club's average rating
        const avgRating = await db.select({
                averageRating: avg(clubRatings.rating)
            })
            .from(clubRatings)
            .where(eq(clubRatings.clubId, clubId));

        await db.update(clubs)
            .set({
                rating: Math.round(avgRating[0].averageRating)
            })
            .where(eq(clubs.id, clubId));

        return result[0];
    } catch (error) {
        console.error('Error rating club:', error);
        throw error;
    }
};

// Get club ratings
const getClubRatings = async(clubId) => {
    try {
        const ratings = await db.select()
            .from(clubRatings)
            .where(eq(clubRatings.clubId, clubId))
            .orderBy(desc(clubRatings.createdAt));

        return ratings;
    } catch (error) {
        console.error('Error getting club ratings:', error);
        throw error;
    }
};

export {
    subscribeToClub,
    unsubscribeFromClub,
    getUserSubscribedClubs,
    rateClub,
    getClubRatings
};