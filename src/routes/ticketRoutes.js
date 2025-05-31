import { Router } from 'express';
import {
    bookTicket,
    getUserTickets,
    getPendingTickets,
    approveTicket,
    rejectTicket,
} from '../controllers/ticketController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../utils/fileUploadService.js';

const router = Router();

router.post('/', authenticate, upload.single('paymentProof'), bookTicket);
router.get('/', authenticate, getUserTickets);
router.get('/pending', authenticate, authorize(['head_admin']), getPendingTickets);
router.put('/:id/approve', authenticate, authorize(['head_admin']), approveTicket);
router.put('/:id/reject', authenticate, authorize(['head_admin']), rejectTicket);

export default router;