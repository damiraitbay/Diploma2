import { Router } from 'express';
import {
    getAllEvents,
    getEventById,
    getEventsByClubId,
    getUserClubEvents
} from '../controllers/eventController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllEvents);
router.get('/my-events', authenticate, authorize(['head_admin']), getUserClubEvents);
router.get('/club/:clubId', getEventsByClubId);
router.get('/:id', getEventById);

export default router;