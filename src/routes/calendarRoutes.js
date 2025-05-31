import { Router } from 'express';
import {
    getCombinedCalendar,
    getHeadAdminCalendar,
    getUserCalendar
} from '../controllers/calendarController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getCombinedCalendar);
router.get('/events', authenticate, getUserCalendar);
router.get('/my-club-calendar', authenticate, authorize(['head_admin']), getHeadAdminCalendar);

export default router;