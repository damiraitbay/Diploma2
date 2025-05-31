import { Router } from 'express';
import {
    createPersonalEvent,
    getUserPersonalEvents,
    getPersonalEventById,
    updatePersonalEvent,
    deletePersonalEvent
} from '../controllers/personalEventController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, createPersonalEvent);
router.get('/', authenticate, getUserPersonalEvents);
router.get('/:id', authenticate, getPersonalEventById);
router.put('/:id', authenticate, updatePersonalEvent);
router.delete('/:id', authenticate, deletePersonalEvent);

export default router;