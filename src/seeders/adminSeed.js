import 'dotenv/config';
import bcrypt from 'bcrypt';
import db from '../db.js';
import { users } from '../models/schema.js';
import { eq } from 'drizzle-orm';

const seedAdmin = async() => {
    try {
        const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@gmail.com')).get();

        if (!existingAdmin) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            await db.insert(users).values({
                name: 'Admin',
                surname: 'User',
                email: 'admin@gmail.com',
                password: hashedPassword,
                role: 'super_admin',
                isEmailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }).run();

            console.log('Admin user created successfully');
        } else {
            console.log('Admin user already exists');
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
}

seedAdmin();