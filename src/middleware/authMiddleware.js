import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import db from '../db.js';
import { users } from '../models/schema.js';

export const authMiddleware = async(req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await db.select().from(users).where(eq(users.id, decoded.id)).get();

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};