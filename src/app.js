import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';
import { specs } from './config/swagger.js';
import {
    authRoutes,
    clubRequestRoutes,
    clubRoutes,
    eventRequestRoutes,
    eventRoutes,
    posterRoutes,
    ticketRoutes,
    postRoutes,
    userRoutes,
    calendarRoutes,
    personalEventRoutes
} from './routes/index.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

//! MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

//! SWAGGER DOCS
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

//! ROUTES
app.get('/', (_, res) => res.send("Hey! It's working fine!"));
app.use('/api/auth', authRoutes);
app.use('/api/club-requests', clubRequestRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/event-requests', eventRequestRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/posters', posterRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/personal-events', personalEventRoutes);
app.use('/api/calendar', calendarRoutes);

//! ERROR
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

export default app;